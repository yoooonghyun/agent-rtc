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

// --- Agent detail types ---

export interface AgentDetail {
  agentId: string;
  displayName: string;
  online: boolean;
  consumers: number;
  messagesReady: number;
  messagesUnacknowledged: number;
  publishRate: number;
  deliverRate: number;
  memory: number | null;
  state: string;
  connections: AgentConnection[];
}

export interface AgentConnection {
  consumerTag: string;
  channelDetails: {
    connectionName: string;
    channelNumber: number;
  } | null;
  clientProperties: Record<string, unknown>;
  connectedAt: string | null;
  channelCount: number | null;
}

// --- RabbitMQ API response types ---

export interface RabbitQueue {
  name: string;
  consumers: number;
  messages: number;
  arguments: Record<string, unknown>;
  state?: string;
}

export interface RabbitQueueDetail extends RabbitQueue {
  messages_ready: number;
  messages_unacknowledged: number;
  memory?: number;
  message_stats?: {
    publish_details?: { rate: number };
    deliver_details?: { rate: number };
    deliver_get_details?: { rate: number };
  };
}

export interface RabbitConsumer {
  consumer_tag: string;
  queue: { name: string };
  channel_details?: {
    connection_name?: string;
    number?: number;
  };
  arguments: Record<string, unknown>;
}

export interface RabbitBinding {
  source: string;
  destination: string;
  routing_key: string;
  destination_type: string;
  arguments: Record<string, unknown>;
}
