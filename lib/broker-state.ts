import type { McpServer } from "@modelcontextprotocol/server";

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

// --- In-memory state (singleton across Route Handlers) ---

const agents = new Map<string, Agent>();
const queues = new Map<string, QueuedMessage[]>();
const masterPool = new Set<string>();
const mcpServers = new Map<string, McpServer>();
const lastHeartbeat = new Map<string, number>();
const messageLog: MessageLog[] = [];
const MAX_LOG_SIZE = 100;
const HEARTBEAT_TIMEOUT_MS = 30_000;

// --- Agent operations ---

export function registerAgent(agentId: string, displayName: string): void {
  agents.set(agentId, { agentId, displayName });
  if (!queues.has(agentId)) {
    queues.set(agentId, []);
  }
  lastHeartbeat.set(agentId, Date.now());
}

export function getAgents(): Agent[] {
  return Array.from(agents.values());
}

export function hasAgent(agentId: string): boolean {
  return agents.has(agentId);
}

// --- MCP server registry ---

export function registerMcpServer(agentId: string, server: McpServer): void {
  mcpServers.set(agentId, server);
}

export function unregisterMcpServer(agentId: string): void {
  mcpServers.delete(agentId);
}

async function notifyAgent(agentId: string, msg: QueuedMessage): Promise<void> {
  const server = mcpServers.get(agentId);
  if (!server) {
    console.log(`[notify] no MCP server for ${agentId}`);
    return;
  }
  try {
    await server.server.notification({
      method: "notifications/claude/channel",
      params: {
        content: msg.text,
        meta: {
          from: msg.from,
          from_name: msg.fromDisplayName,
        },
      },
    });
    console.log(`[notify] pushed to ${agentId}`);
  } catch (err) {
    console.log(`[notify] failed for ${agentId}:`, err);
  }
}

// --- Message operations ---

export function sendMessage(from: string, to: string, text: string): boolean {
  if (!agents.has(to)) return false;
  const fromAgent = agents.get(from);
  const msg: QueuedMessage = {
    from,
    fromDisplayName: fromAgent?.displayName ?? from,
    text,
    timestamp: Date.now(),
  };
  queues.get(to)!.push(msg);

  messageLog.push({ from, fromDisplayName: msg.fromDisplayName, to, text, timestamp: msg.timestamp });
  if (messageLog.length > MAX_LOG_SIZE) {
    messageLog.shift();
  }

  // Push via MCP SSE if agent is connected
  notifyAgent(to, msg);

  return true;
}

export function pollMessages(agentId: string): QueuedMessage[] | null {
  if (!queues.has(agentId)) return null;
  lastHeartbeat.set(agentId, Date.now());
  return queues.get(agentId)!.splice(0);
}

export function getMessageLog(): MessageLog[] {
  return messageLog.slice(-20);
}

// --- Master operations ---

export function addMaster(masterAgentId: string): void {
  masterPool.add(masterAgentId);
}

export function removeMaster(masterAgentId: string): void {
  masterPool.delete(masterAgentId);
}

export function getMasters(): string[] {
  return Array.from(masterPool);
}

// --- Heartbeat sweep ---

function unregisterAgent(agentId: string): void {
  agents.delete(agentId);
  queues.delete(agentId);
  lastHeartbeat.delete(agentId);
  mcpServers.delete(agentId);
  masterPool.delete(agentId);
}

export function sweepStaleAgents(): string[] {
  const now = Date.now();
  const removed: string[] = [];
  for (const [agentId, ts] of lastHeartbeat) {
    if (now - ts > HEARTBEAT_TIMEOUT_MS) {
      console.log(`[sweep] removing stale agent: ${agentId}`);
      unregisterAgent(agentId);
      removed.push(agentId);
    }
  }
  return removed;
}

// --- Stats ---

export function getStats() {
  return {
    agentCount: agents.size,
    masterCount: masterPool.size,
    totalMessages: messageLog.length,
  };
}
