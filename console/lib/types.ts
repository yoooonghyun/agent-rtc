// --- Domain types for the agent-rtc console dashboard ---

export interface Agent {
  agentId: string;
  displayName: string;
  online: boolean;
  messages: number;
  description: string;
  tags: string[];
}

export interface Master {
  agentId: string;
}

export interface Message {
  id: string;
  type: string;
  sender: string;
  senderDisplayName: string;
  receiver: string;
  receiverDisplayName: string;
  text: string;
  timestamp: string;
}

export interface Stats {
  agentCount: number;
  masterCount: number;
  messageCount: number;
}

// --- Agent detail types ---

export interface AgentDetail {
  agentId: string;
  displayName: string;
  online: boolean;
  isMaster: boolean;
  messageCount: number;
  presenceTtl: number;
  description: string;
  tags: string[];
}
