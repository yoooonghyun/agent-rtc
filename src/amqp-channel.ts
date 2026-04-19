import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import http from "node:http";
import amqplib from "amqplib";

// --- Config ---

const AMQP_URL = process.env.AMQP_URL ?? "amqp://localhost";
const RABBITMQ_API = process.env.RABBITMQ_API ?? "http://localhost:15672/api";
const RABBITMQ_USER = process.env.RABBITMQ_USER ?? "guest";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS ?? "guest";
const AGENT_NAME = process.env.AGENT_NAME ?? "Agent";
const AGENT_ID = `agent-${randomUUID().slice(0, 8)}`;
const IS_MASTER = process.env.IS_MASTER === "true";
const EXCHANGE = "agent-rtc";
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i;

// --- RabbitMQ Management API helper ---

function mgmtRequest(method: string, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, RABBITMQ_API);
    const auth = Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASS}`).toString("base64");
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { Authorization: `Basic ${auth}`, "content-type": "application/json" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// --- Connect to RabbitMQ ---

const conn = await amqplib.connect(AMQP_URL);
const ch = await conn.createChannel();

// Declare topic exchange
await ch.assertExchange(EXCHANGE, "topic", { durable: true });

// Declare agent queue (exclusive + autoDelete = removed on disconnect)
// Store displayName in queue arguments for discovery
const agentQueue = `agent.${AGENT_ID}`;
await ch.assertQueue(agentQueue, {
  exclusive: true,
  autoDelete: true,
  arguments: { "x-agent-name": AGENT_NAME },
});
await ch.bindQueue(agentQueue, EXCHANGE, `agent.${AGENT_ID}`);

// Permission queue — created lazily when add_master is called
const permQueue = `perm.${AGENT_ID}`;
let permQueueCreated = false;

process.stderr.write(`[amqp] connected as ${AGENT_ID} (${AGENT_NAME})${IS_MASTER ? " [master]" : ""}\n`);

// Publish agent metadata so others can discover display name
await ch.assertQueue("agent-registry", { durable: true });
ch.sendToQueue(
  "agent-registry",
  Buffer.from(JSON.stringify({ agentId: AGENT_ID, displayName: AGENT_NAME, action: "register" }))
);

// Auto-register as master if IS_MASTER=true
if (IS_MASTER) {
  await ch.assertQueue(permQueue, { exclusive: true, autoDelete: true });
  permQueueCreated = true;
  await ch.bindQueue(permQueue, EXCHANGE, "permission.*");
  // Consume will be set up after MCP server is created (see below)
  process.stderr.write(`[amqp] registered as master\n`);
}

// --- MCP Server ---

const mcp = new Server(
  { name: "agent-rtc", version: "0.3.0" },
  {
    capabilities: {
      experimental: {
        "claude/channel": {},
        "claude/channel/permission": {},
      },
      tools: {},
    },
    instructions: [
      `Messages from other agents arrive as <channel source="agent-rtc" from="agentId" from_name="displayName">.`,
      `Use the reply tool to respond. Pass the from value as targetAgent.`,
      `Use the list_agents tool to see who is online.`,
      `Your identity: agentId="${AGENT_ID}", displayName="${AGENT_NAME}".`,
    ].join(" "),
  }
);

// --- Tools ---

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "reply",
      description: "Send a message to another agent via RabbitMQ",
      inputSchema: {
        type: "object" as const,
        properties: {
          targetAgent: { type: "string", description: "The agentId of the target agent" },
          text: { type: "string", description: "The message to send" },
        },
        required: ["targetAgent", "text"],
      },
    },
    {
      name: "list_agents",
      description: "List all online agents",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "add_master",
      description: "Register this agent as a global master to receive permission relay requests",
      inputSchema: {
        type: "object" as const,
        properties: {
          masterAgentId: { type: "string", description: "The agentId to add as master (use own ID to register self)" },
        },
        required: ["masterAgentId"],
      },
    },
    {
      name: "remove_master",
      description: "Remove an agent from the master pool",
      inputSchema: {
        type: "object" as const,
        properties: {
          masterAgentId: { type: "string", description: "The agentId to remove from master pool" },
        },
        required: ["masterAgentId"],
      },
    },
    {
      name: "list_masters",
      description: "List all master agents",
      inputSchema: { type: "object" as const, properties: {} },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "reply") {
    const { targetAgent, text } = req.params.arguments as { targetAgent: string; text: string };
    const msg = JSON.stringify({ from: AGENT_ID, fromDisplayName: AGENT_NAME, text, timestamp: Date.now() });
    ch.publish(EXCHANGE, `agent.${targetAgent}`, Buffer.from(msg));
    return { content: [{ type: "text" as const, text: "sent" }] };
  }

  if (req.params.name === "list_agents") {
    try {
      const res = await mgmtRequest("GET", "/api/queues/%2F?columns=name,arguments");
      const queues = JSON.parse(res.body) as Array<{ name: string; arguments: Record<string, unknown> }>;
      const agents = queues
        .filter((q) => q.name.startsWith("agent."))
        .map((q) => ({
          agentId: q.name.replace("agent.", ""),
          displayName: (q.arguments?.["x-agent-name"] as string) ?? q.name,
        }));
      return { content: [{ type: "text" as const, text: JSON.stringify(agents) }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `failed: ${err}` }] };
    }
  }

  if (req.params.name === "add_master") {
    const { masterAgentId } = req.params.arguments as { masterAgentId: string };
    try {
      const masterPermQueue = `perm.${masterAgentId}`;
      // Create perm queue if adding self as master
      if (masterAgentId === AGENT_ID && !permQueueCreated) {
        await ch.assertQueue(permQueue, { exclusive: true, autoDelete: true });
        ch.consume(permQueue, (msg) => {
          if (!msg) return;
          ch.ack(msg);
          try {
            const data = JSON.parse(msg.content.toString()) as {
              from: string; fromDisplayName: string; text: string;
            };
            mcp.notification({
              method: "notifications/claude/channel",
              params: {
                content: data.text,
                meta: { from: data.from, from_name: data.fromDisplayName },
              },
            });
          } catch { /* malformed */ }
        });
        permQueueCreated = true;
      }
      await ch.bindQueue(masterPermQueue, EXCHANGE, "permission.*");
      return { content: [{ type: "text" as const, text: `master added: ${masterAgentId}` }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `failed: ${err}` }] };
    }
  }

  if (req.params.name === "remove_master") {
    const { masterAgentId } = req.params.arguments as { masterAgentId: string };
    try {
      const masterPermQueue = `perm.${masterAgentId}`;
      await ch.unbindQueue(masterPermQueue, EXCHANGE, "permission.*");
      return { content: [{ type: "text" as const, text: `master removed: ${masterAgentId}` }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `failed: ${err}` }] };
    }
  }

  if (req.params.name === "list_masters") {
    try {
      const res = await mgmtRequest("GET", "/api/bindings/%2F?columns=source,destination,routing_key");
      const bindings = JSON.parse(res.body) as Array<{ source: string; destination: string; routing_key: string }>;
      const masters = bindings
        .filter((b) => b.source === EXCHANGE && b.routing_key === "permission.*")
        .map((b) => b.destination.replace("perm.", ""));
      return { content: [{ type: "text" as const, text: JSON.stringify(masters) }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `failed: ${err}` }] };
    }
  }

  throw new Error(`unknown tool: ${req.params.name}`);
});

// --- Permission Relay ---

const PermissionRequestSchema = z.object({
  method: z.literal("notifications/claude/channel/permission_request"),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
});

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  const text = [
    `Permission Request from ${AGENT_ID} (${AGENT_NAME})`,
    `Tool: ${params.tool_name}`,
    `Description: ${params.description}`,
    `Preview: ${params.input_preview}`,
    ``,
    `Reply: "yes ${params.request_id}" or "no ${params.request_id}"`,
  ].join("\n");

  // Publish to permission topic — all masters receive it
  const msg = JSON.stringify({ from: AGENT_ID, fromDisplayName: AGENT_NAME, text, timestamp: Date.now() });
  ch.publish(EXCHANGE, `permission.${AGENT_ID}`, Buffer.from(msg));
});

// --- Consume messages ---

ch.consume(agentQueue, (msg) => {
  if (!msg) return;
  ch.ack(msg);
  try {
    const data = JSON.parse(msg.content.toString()) as {
      from: string; fromDisplayName: string; text: string;
    };

    // Check if this is a permission verdict
    const match = PERMISSION_REPLY_RE.exec(data.text);
    if (match) {
      mcp.notification({
        method: "notifications/claude/channel/permission",
        params: {
          request_id: match[2].toLowerCase(),
          behavior: match[1].toLowerCase().startsWith("y") ? "allow" : "deny",
        },
      });
      return;
    }

    // Normal message → channel notification
    mcp.notification({
      method: "notifications/claude/channel",
      params: {
        content: data.text,
        meta: { from: data.from, from_name: data.fromDisplayName },
      },
    });
  } catch {
    // malformed message, skip
  }
});

// Set up permission queue consume if master (auto or via add_master)
if (IS_MASTER && permQueueCreated) {
  ch.consume(permQueue, (msg) => {
    if (!msg) return;
    ch.ack(msg);
    try {
      const data = JSON.parse(msg.content.toString()) as {
        from: string; fromDisplayName: string; text: string;
      };
      mcp.notification({
        method: "notifications/claude/channel",
        params: {
          content: data.text,
          meta: { from: data.from, from_name: data.fromDisplayName },
        },
      });
    } catch { /* malformed */ }
  });
}

// --- Cleanup on exit ---

process.on("SIGINT", async () => {
  await ch.close();
  await conn.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await ch.close();
  await conn.close();
  process.exit(0);
});

// --- MCP stdio connection ---

const transport = new StdioServerTransport();
await mcp.connect(transport);
