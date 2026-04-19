import type { IncomingMessage, ServerResponse } from "node:http";
import { parse } from "node:url";
import {
  registerAgent,
  getAgents,
  sendMessage,
  pollMessages,
  getMasters,
  addMaster,
  removeMaster,
  getStats,
  getMessageLog,
} from "./broker-state.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * Handle REST API requests. Returns true if handled, false if not an API route.
 */
export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { pathname, query } = parse(req.url ?? "", true);
  const method = req.method ?? "";

  if (pathname === "/api/health" && method === "GET") {
    res.writeHead(200);
    res.end("ok");
    return true;
  }

  if (pathname === "/api/register" && method === "POST") {
    const body = JSON.parse(await readBody(req));
    if (!body.agentId || !body.displayName) {
      json(res, 400, { error: "agentId and displayName required" });
      return true;
    }
    registerAgent(body.agentId, body.displayName);
    json(res, 200, { registered: body.agentId });
    return true;
  }

  if (pathname === "/api/send" && method === "POST") {
    const body = JSON.parse(await readBody(req));
    const ok = sendMessage(body.from, body.to, body.text);
    if (!ok) {
      json(res, 404, { error: `agent not found: ${body.to}` });
      return true;
    }
    json(res, 200, { delivered: true });
    return true;
  }

  if (pathname === "/api/poll" && method === "GET") {
    const agentId = query.agentId as string;
    if (!agentId) {
      json(res, 400, { error: "agentId required" });
      return true;
    }
    const messages = pollMessages(agentId);
    if (messages === null) {
      json(res, 404, { error: `agent not found: ${agentId}` });
      return true;
    }
    json(res, 200, { messages });
    return true;
  }

  if (pathname === "/api/agents" && method === "GET") {
    json(res, 200, getAgents());
    return true;
  }

  if (pathname === "/api/masters/add" && method === "POST") {
    const body = JSON.parse(await readBody(req));
    if (!body.masterAgentId) {
      json(res, 400, { error: "masterAgentId required" });
      return true;
    }
    addMaster(body.masterAgentId);
    json(res, 200, { added: body.masterAgentId });
    return true;
  }

  if (pathname === "/api/masters/remove" && method === "POST") {
    const body = JSON.parse(await readBody(req));
    if (!body.masterAgentId) {
      json(res, 400, { error: "masterAgentId required" });
      return true;
    }
    removeMaster(body.masterAgentId);
    json(res, 200, { removed: body.masterAgentId });
    return true;
  }

  if (pathname === "/api/masters" && method === "GET") {
    json(res, 200, getMasters());
    return true;
  }

  if (pathname === "/api/stats" && method === "GET") {
    json(res, 200, getStats());
    return true;
  }

  if (pathname === "/api/messages" && method === "GET") {
    json(res, 200, getMessageLog());
    return true;
  }

  return false;
}
