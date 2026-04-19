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
const messageLog: MessageLog[] = [];
const MAX_LOG_SIZE = 100;

// --- Agent operations ---

export function registerAgent(agentId: string, displayName: string): void {
  agents.set(agentId, { agentId, displayName });
  if (!queues.has(agentId)) {
    queues.set(agentId, []);
  }
}

export function getAgents(): Agent[] {
  return Array.from(agents.values());
}

export function hasAgent(agentId: string): boolean {
  return agents.has(agentId);
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

  return true;
}

export function pollMessages(agentId: string): QueuedMessage[] | null {
  if (!queues.has(agentId)) return null;
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

// --- Stats ---

export function getStats() {
  return {
    agentCount: agents.size,
    masterCount: masterPool.size,
    totalMessages: messageLog.length,
  };
}
