import db from "./db.js";

export interface Agent {
  agentId: string;
  displayName: string;
}

export interface QueuedMessage {
  from: string;
  fromDisplayName: string;
  text: string;
  timestamp: number;
}

export interface MessageLog {
  from: string;
  fromDisplayName: string;
  to: string;
  text: string;
  timestamp: number;
}

const HEARTBEAT_TIMEOUT_MS = 30_000;
const MAX_LOG_SIZE = 1000;

// --- Prepared statements ---

const stmts = {
  registerAgent: db.prepare(
    `INSERT INTO agents (agentId, displayName, lastHeartbeat) VALUES (?, ?, ?)
     ON CONFLICT(agentId) DO UPDATE SET displayName = excluded.displayName, lastHeartbeat = excluded.lastHeartbeat`
  ),
  getAgents: db.prepare(`SELECT agentId, displayName FROM agents`),
  hasAgent: db.prepare(`SELECT 1 FROM agents WHERE agentId = ?`),
  updateHeartbeat: db.prepare(`UPDATE agents SET lastHeartbeat = ? WHERE agentId = ?`),
  deleteAgent: db.prepare(`DELETE FROM agents WHERE agentId = ?`),
  getStaleAgents: db.prepare(`SELECT agentId FROM agents WHERE lastHeartbeat < ?`),

  insertMessage: db.prepare(
    `INSERT INTO messages (toAgentId, fromAgentId, fromDisplayName, text, timestamp) VALUES (?, ?, ?, ?, ?)`
  ),
  pollMessages: db.prepare(
    `SELECT id, fromAgentId, fromDisplayName, text, timestamp FROM messages WHERE toAgentId = ?`
  ),
  deleteMessages: db.prepare(`DELETE FROM messages WHERE toAgentId = ?`),

  insertLog: db.prepare(
    `INSERT INTO message_log (fromAgentId, fromDisplayName, toAgentId, text, timestamp) VALUES (?, ?, ?, ?, ?)`
  ),
  getLog: db.prepare(`SELECT fromAgentId, fromDisplayName, toAgentId, text, timestamp FROM message_log ORDER BY id DESC LIMIT 20`),
  trimLog: db.prepare(`DELETE FROM message_log WHERE id NOT IN (SELECT id FROM message_log ORDER BY id DESC LIMIT ?)`),

  addMaster: db.prepare(`INSERT OR IGNORE INTO masters (agentId) VALUES (?)`),
  removeMaster: db.prepare(`DELETE FROM masters WHERE agentId = ?`),
  getMasters: db.prepare(`SELECT agentId FROM masters`),

  countAgents: db.prepare(`SELECT COUNT(*) as count FROM agents`),
  countMasters: db.prepare(`SELECT COUNT(*) as count FROM masters`),
  countLog: db.prepare(`SELECT COUNT(*) as count FROM message_log`),
};

// --- Agent operations ---

export function registerAgent(agentId: string, displayName: string): void {
  stmts.registerAgent.run(agentId, displayName, Date.now());
}

export function getAgents(): Agent[] {
  return stmts.getAgents.all() as Agent[];
}

export function hasAgent(agentId: string): boolean {
  return !!stmts.hasAgent.get(agentId);
}

// --- Message operations ---

export function sendMessage(from: string, to: string, text: string): boolean {
  if (!hasAgent(to)) return false;
  const fromAgent = stmts.hasAgent.get(from) ? (stmts.getAgents.all() as Agent[]).find(a => a.agentId === from) : null;
  const fromDisplayName = fromAgent?.displayName ?? from;
  const timestamp = Date.now();

  stmts.insertMessage.run(to, from, fromDisplayName, text, timestamp);
  stmts.insertLog.run(from, fromDisplayName, to, text, timestamp);
  stmts.trimLog.run(MAX_LOG_SIZE);

  return true;
}

export function pollMessages(agentId: string): QueuedMessage[] | null {
  if (!hasAgent(agentId)) return null;
  stmts.updateHeartbeat.run(Date.now(), agentId);

  const rows = stmts.pollMessages.all(agentId) as Array<{
    id: number; fromAgentId: string; fromDisplayName: string; text: string; timestamp: number;
  }>;
  if (rows.length > 0) {
    stmts.deleteMessages.run(agentId);
  }
  return rows.map(r => ({
    from: r.fromAgentId,
    fromDisplayName: r.fromDisplayName,
    text: r.text,
    timestamp: r.timestamp,
  }));
}

export function getMessageLog(): MessageLog[] {
  const rows = stmts.getLog.all() as Array<{
    fromAgentId: string; fromDisplayName: string; toAgentId: string; text: string; timestamp: number;
  }>;
  return rows.map(r => ({
    from: r.fromAgentId,
    fromDisplayName: r.fromDisplayName,
    to: r.toAgentId,
    text: r.text,
    timestamp: r.timestamp,
  }));
}

// --- Heartbeat sweep ---

function unregisterAgent(agentId: string): void {
  stmts.deleteAgent.run(agentId);
  stmts.deleteMessages.run(agentId);
  stmts.removeMaster.run(agentId);
}

export function sweepStaleAgents(): string[] {
  const cutoff = Date.now() - HEARTBEAT_TIMEOUT_MS;
  const stale = stmts.getStaleAgents.all(cutoff) as Array<{ agentId: string }>;
  for (const { agentId } of stale) {
    console.log(`[sweep] removing stale agent: ${agentId}`);
    unregisterAgent(agentId);
  }
  return stale.map(s => s.agentId);
}

// --- Master operations ---

export function addMaster(masterAgentId: string): void {
  stmts.addMaster.run(masterAgentId);
}

export function removeMaster(masterAgentId: string): void {
  stmts.removeMaster.run(masterAgentId);
}

export function getMasters(): string[] {
  return (stmts.getMasters.all() as Array<{ agentId: string }>).map(r => r.agentId);
}

// --- Stats ---

export function getStats() {
  return {
    agentCount: (stmts.countAgents.get() as { count: number }).count,
    masterCount: (stmts.countMasters.get() as { count: number }).count,
    totalMessages: (stmts.countLog.get() as { count: number }).count,
  };
}
