import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import http from "node:http";
import type { BrokerChannelConfig, BrokerReplyArgs, QueuedMessage } from "./types.js";

const config: BrokerChannelConfig = {
  brokerUrl: process.env.BROKER_URL ?? "http://127.0.0.1:8000",
  agentId: process.env.AGENT_ID ?? "agent-default",
  displayName: process.env.AGENT_DISPLAY_NAME ?? "Agent",
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS ?? "1000", 10),
};

let masterAgent = "";
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i;

async function fetchMaster(): Promise<void> {
  try {
    const res = await httpRequest("GET", `${config.brokerUrl}/master?agentId=${config.agentId}`);
    if (res.status === 200) {
      const data = JSON.parse(res.body) as { masterAgentId: string | null };
      masterAgent = data.masterAgentId ?? "";
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
  { name: "broker-channel", version: "0.2.0" },
  {
    capabilities: {
      experimental: {
        "claude/channel": {},
        "claude/channel/permission": {},
      },
      tools: {},
    },
    instructions: [
      `Messages from other agents arrive as <channel source="broker-channel" from="agentId" from_name="displayName">.`,
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
      name: "set_master",
      description: "Register a master agent for a given agent. The master receives permission relay requests.",
      inputSchema: {
        type: "object" as const,
        properties: {
          agentId: {
            type: "string",
            description: "The agent to set a master for",
          },
          masterAgentId: {
            type: "string",
            description: "The master agent that will handle permission requests",
          },
        },
        required: ["agentId", "masterAgentId"],
      },
    },
    {
      name: "get_master",
      description: "Get the master agent for a given agent",
      inputSchema: {
        type: "object" as const,
        properties: {
          agentId: {
            type: "string",
            description: "The agent to query",
          },
        },
        required: ["agentId"],
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

  if (req.params.name === "set_master") {
    const { agentId, masterAgentId } = req.params.arguments as unknown as { agentId: string; masterAgentId: string };
    try {
      const res = await httpRequest(
        "POST",
        `${config.brokerUrl}/master`,
        JSON.stringify({ agentId, masterAgentId })
      );
      if (res.status === 404) {
        return { content: [{ type: "text" as const, text: `master agent not found: ${masterAgentId}` }] };
      }
      // Update local cache if setting for self
      if (agentId === config.agentId) {
        masterAgent = masterAgentId;
      }
      return { content: [{ type: "text" as const, text: `master set: ${agentId} → ${masterAgentId}` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
    }
  }

  if (req.params.name === "get_master") {
    const { agentId } = req.params.arguments as unknown as { agentId: string };
    try {
      const res = await httpRequest("GET", `${config.brokerUrl}/master?agentId=${agentId}`);
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
  const text = [
    `Permission Request from ${config.agentId} (${config.displayName})`,
    `Tool: ${params.tool_name}`,
    `Description: ${params.description}`,
    `Preview: ${params.input_preview}`,
    ``,
    `Reply: "yes ${params.request_id}" or "no ${params.request_id}"`,
  ].join("\n");

  try {
    await httpRequest(
      "POST",
      `${config.brokerUrl}/send`,
      JSON.stringify({ from: config.agentId, to: masterAgent, text })
    );
  } catch {
    process.stderr.write(`failed to relay permission request to ${masterAgent}\n`);
  }
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
await fetchMaster();
const transport = new StdioServerTransport();
await mcp.connect(transport);

setInterval(async () => {
  await fetchMaster();
  await poll();
}, config.pollIntervalMs);
