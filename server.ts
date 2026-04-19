import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
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
  sweepStaleAgents,
} from "./lib/broker-state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = parseInt(process.env.PORT ?? "8800", 10);

const app = express();

// --- REST API ---

const api = express.Router();
api.use(express.json());

api.get("/health", (_req, res) => { res.send("ok"); });

api.post("/register", (req, res) => {
  const { agentId, displayName } = req.body;
  if (!agentId || !displayName) return res.status(400).json({ error: "agentId and displayName required" });
  registerAgent(agentId, displayName);
  res.json({ registered: agentId });
});

api.post("/send", (req, res) => {
  const { from, to, text } = req.body;
  if (!sendMessage(from, to, text)) return res.status(404).json({ error: `agent not found: ${to}` });
  res.json({ delivered: true });
});

api.get("/poll", (req, res) => {
  const agentId = req.query.agentId as string;
  if (!agentId) return res.status(400).json({ error: "agentId required" });
  const messages = pollMessages(agentId);
  if (messages === null) return res.status(404).json({ error: `agent not found: ${agentId}` });
  res.json({ messages });
});

api.get("/agents", (_req, res) => { res.json(getAgents()); });
api.get("/masters", (_req, res) => { res.json(getMasters()); });

api.post("/masters/add", (req, res) => {
  const { masterAgentId } = req.body;
  if (!masterAgentId) return res.status(400).json({ error: "masterAgentId required" });
  addMaster(masterAgentId);
  res.json({ added: masterAgentId });
});

api.post("/masters/remove", (req, res) => {
  const { masterAgentId } = req.body;
  if (!masterAgentId) return res.status(400).json({ error: "masterAgentId required" });
  removeMaster(masterAgentId);
  res.json({ removed: masterAgentId });
});

api.get("/stats", (_req, res) => { res.json(getStats()); });
api.get("/messages", (_req, res) => { res.json(getMessageLog()); });

app.use("/api", api);

// --- Static files (production) ---

const clientDir = path.join(__dirname, "client");
app.use(express.static(clientDir));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

// --- Start ---

setInterval(sweepStaleAgents, 10_000);

app.listen(port, () => {
  console.log(`agent-rtc listening on http://127.0.0.1:${port}`);
  console.log(`  Dashboard: http://127.0.0.1:${port}/`);
  console.log(`  API:       http://127.0.0.1:${port}/api/*`);
});
