import http from "node:http";
import type {
  Agent,
  RegisterPayload,
  SendPayload,
  QueuedMessage,
  PollResponse,
} from "./types.js";

const PORT = parseInt(process.env.BROKER_PORT ?? "8000", 10);

// --- In-memory state ---

const agents = new Map<string, Agent>();
const queues = new Map<string, QueuedMessage[]>();
const masterPool = new Set<string>(); // global master agent IDs

// --- Helpers ---

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function error(res: http.ServerResponse, status: number, message: string) {
  json(res, status, { error: message });
}

// --- HTTP Server ---

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

  // Health
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  // Register
  if (req.method === "POST" && url.pathname === "/register") {
    const body = JSON.parse(await readBody(req)) as RegisterPayload;
    if (!body.agentId || !body.displayName) {
      error(res, 400, "agentId and displayName required");
      return;
    }
    agents.set(body.agentId, {
      agentId: body.agentId,
      displayName: body.displayName,
    });
    if (!queues.has(body.agentId)) {
      queues.set(body.agentId, []);
    }
    json(res, 200, { registered: body.agentId });
    return;
  }

  // Send
  if (req.method === "POST" && url.pathname === "/send") {
    const body = JSON.parse(await readBody(req)) as SendPayload;
    if (!agents.has(body.to)) {
      error(res, 404, `agent not found: ${body.to}`);
      return;
    }
    const fromAgent = agents.get(body.from);
    const queue = queues.get(body.to)!;
    queue.push({
      from: body.from,
      fromDisplayName: fromAgent?.displayName ?? body.from,
      text: body.text,
      timestamp: Date.now(),
    });
    json(res, 200, { delivered: true });
    return;
  }

  // Poll
  if (req.method === "GET" && url.pathname === "/poll") {
    const agentId = url.searchParams.get("agentId");
    if (!agentId || !queues.has(agentId)) {
      error(res, 404, `agent not found: ${agentId}`);
      return;
    }
    const queue = queues.get(agentId)!;
    const messages = queue.splice(0);
    const response: PollResponse = { messages };
    json(res, 200, response);
    return;
  }

  // Add global master
  if (req.method === "POST" && url.pathname === "/masters/add") {
    const body = JSON.parse(await readBody(req)) as { masterAgentId: string };
    if (!body.masterAgentId) {
      error(res, 400, "masterAgentId required");
      return;
    }
    masterPool.add(body.masterAgentId);
    json(res, 200, { added: body.masterAgentId });
    return;
  }

  // Remove global master
  if (req.method === "POST" && url.pathname === "/masters/remove") {
    const body = JSON.parse(await readBody(req)) as { masterAgentId: string };
    if (!body.masterAgentId) {
      error(res, 400, "masterAgentId required");
      return;
    }
    masterPool.delete(body.masterAgentId);
    json(res, 200, { removed: body.masterAgentId });
    return;
  }

  // List global masters
  if (req.method === "GET" && url.pathname === "/masters") {
    json(res, 200, Array.from(masterPool));
    return;
  }

  // Agents list
  if (req.method === "GET" && url.pathname === "/agents") {
    json(res, 200, Array.from(agents.values()));
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  process.stderr.write(`broker listening on port ${PORT}\n`);
});
