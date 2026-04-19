import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { parse } from "node:url";
import next from "next";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { createAgentMcpServer } from "./lib/mcp-server.js";
import { handleApi } from "./lib/api-handler.js";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "8800", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

// MCP session store
const transports = new Map<string, NodeStreamableHTTPServerTransport>();

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
  });
}

async function handleMcp(req: IncomingMessage, res: ServerResponse) {
  const method = req.method ?? "";
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const parsed = parse(req.url ?? "", true);

  if (method === "POST") {
    const body = await readBody(req);

    // Existing session
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res, body);
      return;
    }

    // New session
    if (!sessionId && isInitializeRequest(body)) {
      const agentId = (parsed.query.agentId as string) ?? `agent-${randomUUID().slice(0, 8)}`;
      const displayName = (parsed.query.displayName as string) ?? "Agent";

      const server = createAgentMcpServer(agentId, displayName);
      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => transports.set(sid, transport),
      });

      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, body);
      return;
    }

    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid request" }));
    return;
  }

  if (method === "GET") {
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      return;
    }
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "No session" }));
    return;
  }

  if (method === "DELETE") {
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.close();
      transports.delete(sessionId);
    }
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(405, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Method not allowed" }));
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url ?? "", true);

    // MCP endpoint
    if (parsedUrl.pathname === "/mcp") {
      await handleMcp(req, res);
      return;
    }

    // REST API — shared state with MCP
    if (parsedUrl.pathname?.startsWith("/api/")) {
      const handled = await handleApi(req, res);
      if (handled) return;
    }

    // Everything else — Next.js (dashboard UI)
    await handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`agent-rtc listening on http://127.0.0.1:${port}`);
    console.log(`  Dashboard: http://127.0.0.1:${port}/`);
    console.log(`  MCP:       http://127.0.0.1:${port}/mcp`);
    console.log(`  API:       http://127.0.0.1:${port}/api/*`);
  });
});
