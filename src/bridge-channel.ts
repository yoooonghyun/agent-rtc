import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import http from "node:http";
import type { ChannelConfig, ReplyArgs } from "./types.js";

const config: ChannelConfig = {
  port: parseInt(process.env.BRIDGE_PORT ?? "8001", 10),
};

// --- MCP Server ---

const mcp = new Server(
  { name: "agent-bridge", version: "0.1.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions: [
      `Messages from other Claude sessions arrive as <channel source="agent-bridge" sender_port="...">.`,
      `Use the reply tool to send a response back. Pass the sender_port from the tag as targetPort.`,
      `This channel enables direct communication between Claude Code sessions.`,
    ].join(" "),
  }
);

// --- Reply Tool ---

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "reply",
      description: "Send a message to another Claude session via its HTTP port",
      inputSchema: {
        type: "object" as const,
        properties: {
          targetPort: {
            type: "number",
            description: "The port of the target session to reply to",
          },
          text: {
            type: "string",
            description: "The message to send",
          },
        },
        required: ["targetPort", "text"],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "reply") {
    const { targetPort, text } = req.params.arguments as unknown as ReplyArgs;
    try {
      await sendHttp(targetPort, text);
      return { content: [{ type: "text" as const, text: "sent" }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `failed: ${msg}` }] };
    }
  }
  throw new Error(`unknown tool: ${req.params.name}`);
});

// --- HTTP helpers ---

function sendHttp(port: number, body: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        method: "POST",
        path: "/",
        headers: { "content-type": "text/plain", "x-sender-port": String(config.port) },
      },
      (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`target responded with ${res.statusCode}`));
        }
      }
    );
    req.on("error", (e) => reject(new Error(`cannot reach port ${port}: ${e.message}`)));
    req.end(body);
  });
}

// --- HTTP Server (inbound) ---

const httpServer = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  // Reply proxy endpoint
  if (req.method === "POST" && req.url === "/reply") {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", async () => {
      try {
        const { targetPort, text } = JSON.parse(data) as ReplyArgs;
        await sendHttp(targetPort, text);
        res.writeHead(200);
        res.end("ok");
      } catch (err) {
        res.writeHead(502);
        res.end(err instanceof Error ? err.message : String(err));
      }
    });
    return;
  }

  // Only accept POST on /
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("method not allowed");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    if (!body.trim()) {
      res.writeHead(400);
      res.end("empty body");
      return;
    }

    const senderPort = req.headers["x-sender-port"] ?? "unknown";

    // Push to Claude via MCP notification
    try {
      await mcp.notification({
        method: "notifications/claude/channel",
        params: {
          content: body,
          meta: { sender_port: String(senderPort) },
        },
      });
    } catch {
      // MCP not connected (standalone mode) — ignore
    }

    res.writeHead(200);
    res.end("ok");
  });
});

httpServer.listen(config.port, "127.0.0.1", () => {
  // stderr로 출력 (stdout은 MCP stdio가 사용)
  process.stderr.write(`agent-bridge channel listening on port ${config.port}\n`);
});

// --- MCP stdio connection ---

const transport = new StdioServerTransport();
await mcp.connect(transport);
