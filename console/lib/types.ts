// --- Domain types for the agent-rtc console dashboard ---

export interface Agent {
  agentId: string;
  displayName: string;
  online: boolean;
  consumers: number;
  messages: number;
}

export interface Master {
  agentId: string;
  routingKey: string;
  source: string;
  destination: string;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
}

export interface Stats {
  agentCount: number;
  masterCount: number;
  messageCount: number;
}

// --- RabbitMQ API response types ---

export interface RabbitQueue {
  name: string;
  consumers: number;
  messages: number;
  arguments: Record<string, unknown>;
  state?: string;
}

export interface RabbitBinding {
  source: string;
  destination: string;
  routing_key: string;
  destination_type: string;
  arguments: Record<string, unknown>;
}
