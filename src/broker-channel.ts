import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import http from "node:http";
import type { BrokerChannelConfig, BrokerReplyArgs, QueuedMessage } from "./types.js";

const config: BrokerChannelConfig = {
  brokerUrl: process.env.BROKER_URL ?? "http://127.0.0.1:8000",
  agentId: `agent-${randomUUID().slice(0, 8)}`,
  displayName: process.env.AGENT_NAME ?? "Agent",
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS ?? "1000", 10),
};

let masterPool: string[] = [];
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i;

async function fetchMasters(): Promise<void> {
  try {
    const res = await httpRequest("GET", `${config.brokerUrl}/masters`);
    if (res.status === 200) {
      masterPool = JSON.parse(res.body) as string[];
    }
  } catch {
    // broker unreachable
  }
}

// --- HTTP helpers ---

function httpRequest(
  method: string,
  urlStr: string,
  body?: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: body ? { "content-type": "application/json" } : {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

// --- MCP Server ---

const mcp = new Server(
  { name: "agent-rtc", version: "0.2.0" },
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
      `Your identity: agentId="${config.agentId}", displayName="${config.displayName}".`,
    ].join(" "),
  }
);

// --- Tools ---

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "reply",
      description: "Send a message to another agent via the broker",
      inputSchema: {
        type: "object" as const,
        properties: {
          targetAgent: {
            type: "string",
            description: "The agentId of the target agent",
          },
          text: {
            type: "string",
            description: "The message to send",
          },
        },
        required: ["targetAgent", "text"],
      },
    },
    {
      name: "list_agents",
      description: "List all registered agents on the broker",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "add_master",
      description: "Add an agent to the global master pool. Masters receive permission relay requests from all agents.",
      inputSchema: {
        type: "object" as const,
        properties: {
          masterAgentId: {
            type: "string",
            description: "The agentId to add as a global master",
          },
        },
        required: ["masterAgentId"],
      },
    },
    {
      name: "remove_master",
      description: "Remove an agent from the global master pool",
      inputSchema: {
        type: "object" as const,
        properties: {
          masterAgentId: {
            type: "string",
            description: "The agentId to remove from the master pool",
          },
        },
        required: ["masterAgentId"],
      },
    },
    {
      name: "list_masters",
      description: "List all global master agents",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "reply") {
    const { targetAgent, text } = req.params.arguments as unknown as BrokerReplyArgs;
    try {
      const res = await httpRequest(
        "POST",
        `${config.brokerUrl}/send`,
        JSON.stringify({ from: config.agentId, to: targetAgent, text })
      );
      if (res.status === 404) {
        return { content: [{ type: "text" as const, text: `agent not found: ${targetAgent}` }] };
      }
      return { content: [{ type: "text" as const, text: "sent" }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
    }
  }

  if (req.params.name === "add_master") {
    const { masterAgentId } = req.params.arguments as unknown as { masterAgentId: string };
    try {
      await httpRequest(
        "POST",
        `${config.brokerUrl}/masters/add`,
        JSON.stringify({ masterAgentId })
      );
      await fetchMasters();
      return { content: [{ type: "text" as const, text: `master added: ${masterAgentId}` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
    }
  }

  if (req.params.name === "remove_master") {
    const { masterAgentId } = req.params.arguments as unknown as { masterAgentId: string };
    try {
      await httpRequest(
        "POST",
        `${config.brokerUrl}/masters/remove`,
        JSON.stringify({ masterAgentId })
      );
      await fetchMasters();
      return { content: [{ type: "text" as const, text: `master removed: ${masterAgentId}` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
    }
  }

  if (req.params.name === "list_masters") {
    try {
      const res = await httpRequest("GET", `${config.brokerUrl}/masters`);
      return { content: [{ type: "text" as const, text: res.body }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
    }
  }

  if (req.params.name === "list_agents") {
    try {
      const res = await httpRequest("GET", `${config.brokerUrl}/agents`);
      return { content: [{ type: "text" as const, text: res.body }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
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
  if (masterPool.length === 0) {
    process.stderr.write(`permission relay skipped: no masters registered\n`);
    return;
  }

  const text = [
    `Permission Request from ${config.agentId} (${config.displayName})`,
    `Tool: ${params.tool_name}`,
    `Description: ${params.description}`,
    `Preview: ${params.input_preview}`,
    ``,
    `Reply: "yes ${params.request_id}" or "no ${params.request_id}"`,
  ].join("\n");

  // Fan-out to all masters
  await Promise.allSettled(
    masterPool.map((master) =>
      httpRequest(
        "POST",
        `${config.brokerUrl}/send`,
        JSON.stringify({ from: config.agentId, to: master, text })
      ).catch(() => {
        process.stderr.write(`failed to relay permission request to ${master}\n`);
      })
    )
  );
});

// --- Register with broker ---

async function register(): Promise<void> {
  try {
    await httpRequest(
      "POST",
      `${config.brokerUrl}/register`,
      JSON.stringify({ agentId: config.agentId, displayName: config.displayName })
    );
    process.stderr.write(`registered as ${config.agentId} (${config.displayName})\n`);
  } catch {
    process.stderr.write(`broker not reachable, retrying in 3s...\n`);
    setTimeout(register, 3000);
  }
}

// --- Poll loop ---

async function poll(): Promise<void> {
  try {
    const res = await httpRequest(
      "GET",
      `${config.brokerUrl}/poll?agentId=${config.agentId}`
    );
    if (res.status === 200) {
      const data = JSON.parse(res.body) as { messages: QueuedMessage[] };
      for (const msg of data.messages) {
        // Check if this is a permission verdict
        const match = PERMISSION_REPLY_RE.exec(msg.text);
        if (match) {
          await mcp.notification({
            method: "notifications/claude/channel/permission",
            params: {
              request_id: match[2].toLowerCase(),
              behavior: match[1].toLowerCase().startsWith("y") ? "allow" : "deny",
            },
          });
          continue;
        }

        // Normal message
        await mcp.notification({
          method: "notifications/claude/channel",
          params: {
            content: msg.text,
            meta: {
              from: msg.from,
              from_name: msg.fromDisplayName,
            },
          },
        });
      }
    }
  } catch {
    // broker unreachable, will retry next interval
  }
}

// --- Start ---

await register();
await fetchMasters();
const transport = new StdioServerTransport();
await mcp.connect(transport);

setInterval(async () => {
  await fetchMasters();
  await poll();
}, config.pollIntervalMs);
