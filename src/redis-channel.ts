#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import Redis from "ioredis";

// --- Config ---

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const AGENT_NAME = process.env.AGENT_NAME ?? "Agent";
const AGENT_ID = `agent-${randomUUID().slice(0, 8)}`;
const IS_MASTER = process.env.IS_MASTER === "true";
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i;

// Key prefix
const P = "agent-rtc";
const PRESENCE_TTL = 30;
const PRESENCE_REFRESH_MS = 10_000;
const SWEEP_INTERVAL_MS = 15_000;
const STREAM_MAXLEN = 10000;

// --- Redis connections (separate for XREAD BLOCK) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RedisConstructor = Redis as any;
const redis = new RedisConstructor(REDIS_URL);
const redisSub = new RedisConstructor(REDIS_URL);
let redisPermSub: any = IS_MASTER ? new RedisConstructor(REDIS_URL) : null;
let permListenerStarted = false;

// --- Register agent ---

await redis.sadd(`${P}:agents`, AGENT_ID);
await redis.hset(`${P}:meta:${AGENT_ID}`, "displayName", AGENT_NAME);
await redis.set(`${P}:presence:${AGENT_ID}`, "1", "EX", PRESENCE_TTL);

if (IS_MASTER) {
  await redis.sadd(`${P}:masters`, AGENT_ID);
}

process.stderr.write(`[redis] connected as ${AGENT_ID} (${AGENT_NAME})${IS_MASTER ? " [master]" : ""}\n`);

// --- Presence refresh ---

const presenceTimer = setInterval(async () => {
  await redis.set(`${P}:presence:${AGENT_ID}`, "1", "EX", PRESENCE_TTL);
}, PRESENCE_REFRESH_MS);

// --- Sweep stale agents ---

const sweepTimer = setInterval(async () => {
  const agents = await redis.smembers(`${P}:agents`);
  for (const id of agents) {
    const alive = await redis.exists(`${P}:presence:${id}`);
    if (!alive) {
      await redis.srem(`${P}:agents`, id);
      await redis.del(`${P}:meta:${id}`);
      await redis.srem(`${P}:masters`, id);
      process.stderr.write(`[sweep] removed stale agent: ${id}\n`);
    }
  }
}, SWEEP_INTERVAL_MS);

// --- MCP Server ---

const mcp = new Server(
  { name: "agent-rtc", version: "0.4.0" },
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
      description: "Send a message to another agent via Redis Streams",
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
      description: "Add an agent to the global master pool",
      inputSchema: {
        type: "object" as const,
        properties: {
          masterAgentId: { type: "string", description: "The agentId to add as master" },
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
          masterAgentId: { type: "string", description: "The agentId to remove" },
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
    const msg = JSON.stringify({
      type: "message",
      from: AGENT_ID,
      fromDisplayName: AGENT_NAME,
      to: targetAgent,
      text,
      timestamp: Date.now(),
    });
    // Write to target agent's stream
    await redis.xadd(`${P}:agent:${targetAgent}`, "MAXLEN", "~", String(STREAM_MAXLEN), "*", "data", msg);
    // Write to global messages stream for console history
    await redis.xadd(`${P}:messages`, "MAXLEN", "~", String(STREAM_MAXLEN), "*", "data", msg);
    return { content: [{ type: "text" as const, text: "sent" }] };
  }

  if (req.params.name === "list_agents") {
    const agentIds = await redis.smembers(`${P}:agents`);
    const agents = await Promise.all(
      agentIds.map(async (id: string) => {
        const meta = await redis.hgetall(`${P}:meta:${id}`);
        const online = await redis.exists(`${P}:presence:${id}`);
        return { agentId: id, displayName: meta.displayName ?? id, online: !!online };
      })
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(agents) }] };
  }

  if (req.params.name === "add_master") {
    const { masterAgentId } = req.params.arguments as { masterAgentId: string };
    await redis.sadd(`${P}:masters`, masterAgentId);
    // Start permission listener if adding self and not already listening
    if (masterAgentId === AGENT_ID && !permListenerStarted) {
      if (!redisPermSub) {
        redisPermSub = new RedisConstructor(REDIS_URL);
      }
      listenPermissionStream();
      permListenerStarted = true;
      process.stderr.write(`[redis] started permission listener\n`);
    }
    return { content: [{ type: "text" as const, text: `master added: ${masterAgentId}` }] };
  }

  if (req.params.name === "remove_master") {
    const { masterAgentId } = req.params.arguments as { masterAgentId: string };
    await redis.srem(`${P}:masters`, masterAgentId);
    return { content: [{ type: "text" as const, text: `master removed: ${masterAgentId}` }] };
  }

  if (req.params.name === "list_masters") {
    const masters = await redis.smembers(`${P}:masters`);
    return { content: [{ type: "text" as const, text: JSON.stringify(masters) }] };
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

  const msg = JSON.stringify({
    type: "permission_request",
    from: AGENT_ID,
    fromDisplayName: AGENT_NAME,
    text,
    timestamp: Date.now(),
  });
  await redis.xadd(`${P}:permissions`, "MAXLEN", "~", String(STREAM_MAXLEN), "*", "data", msg);
});

// --- Subscribe to own agent stream ---

async function listenAgentStream() {
  let lastId = "$";
  while (true) {
    try {
      const result = await redisSub.xread("BLOCK", 0, "STREAMS", `${P}:agent:${AGENT_ID}`, lastId);
      if (!result) continue;
      for (const [, entries] of result) {
        for (const [id, fields] of entries) {
          lastId = id;
          const dataIndex = fields.indexOf("data");
          if (dataIndex === -1) continue;
          const raw = fields[dataIndex + 1];
          try {
            const data = JSON.parse(raw) as {
              type?: string; from: string; fromDisplayName: string; text: string;
            };

            // Skip permission requests on agent stream
            if (data.type === "permission_request") continue;

            // Check if permission verdict
            const match = PERMISSION_REPLY_RE.exec(data.text);
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
                content: data.text,
                meta: { from: data.from, from_name: data.fromDisplayName },
              },
            });
          } catch { /* malformed */ }
        }
      }
    } catch (err) {
      // Connection lost, retry
      process.stderr.write(`[redis] agent stream error: ${err}\n`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// --- Subscribe to permissions stream (masters only) ---

async function listenPermissionStream() {
  if (!redisPermSub) return;
  let lastId = "$";
  while (true) {
    try {
      const result = await redisPermSub.xread("BLOCK", 0, "STREAMS", `${P}:permissions`, lastId);
      if (!result) continue;
      for (const [, entries] of result) {
        for (const [id, fields] of entries) {
          lastId = id;
          const dataIndex = fields.indexOf("data");
          if (dataIndex === -1) continue;
          const raw = fields[dataIndex + 1];
          try {
            const data = JSON.parse(raw) as {
              from: string; fromDisplayName: string; text: string;
            };
            // Skip own permission requests
            if (data.from === AGENT_ID) continue;
            await mcp.notification({
              method: "notifications/claude/channel",
              params: {
                content: data.text,
                meta: { from: data.from, from_name: data.fromDisplayName },
              },
            });
          } catch { /* malformed */ }
        }
      }
    } catch (err) {
      process.stderr.write(`[redis] permission stream error: ${err}\n`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// --- Cleanup ---

async function cleanup() {
  clearInterval(presenceTimer);
  clearInterval(sweepTimer);
  await redis.srem(`${P}:agents`, AGENT_ID);
  await redis.del(`${P}:presence:${AGENT_ID}`);
  await redis.del(`${P}:meta:${AGENT_ID}`);
  await redis.srem(`${P}:masters`, AGENT_ID);
  redis.disconnect();
  redisSub.disconnect();
  redisPermSub?.disconnect();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// --- Start ---

const transport = new StdioServerTransport();
await mcp.connect(transport);

// Start stream listeners (non-blocking)
listenAgentStream();
if (IS_MASTER) {
  listenPermissionStream();
  permListenerStarted = true;
}
