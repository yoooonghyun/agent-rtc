import type {
  Agent,
  AgentDetail,
  Master,
  RabbitQueue,
  RabbitQueueDetail,
  RabbitBinding,
  RabbitConsumer,
} from "./types";

async function rabbitFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api/rabbitmq?path=${encodeURIComponent(path)}`);

  if (!res.ok) {
    throw new Error(`RabbitMQ API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAgents(): Promise<Agent[]> {
  const queues = await rabbitFetch<RabbitQueue[]>("/queues/%2F");

  return queues
    .filter((q) => q.name.startsWith("agent."))
    .map((q) => ({
      agentId: q.name.replace("agent.", ""),
      displayName:
        (q.arguments?.["x-agent-name"] as string) ||
        q.name.replace("agent.", ""),
      online: q.consumers > 0,
      consumers: q.consumers,
      messages: q.messages,
    }));
}

export async function fetchAgentDetail(
  agentId: string
): Promise<AgentDetail> {
  const queueName = `agent.${agentId}`;

  const [queue, allConsumers] = await Promise.all([
    rabbitFetch<RabbitQueueDetail>(`/queues/%2F/${encodeURIComponent(queueName)}`),
    rabbitFetch<RabbitConsumer[]>("/consumers"),
  ]);

  const consumers = allConsumers.filter((c) => c.queue.name === queueName);

  return {
    agentId,
    displayName:
      (queue.arguments?.["x-agent-name"] as string) || agentId,
    online: queue.consumers > 0,
    consumers: queue.consumers,
    messagesReady: queue.messages_ready ?? 0,
    messagesUnacknowledged: queue.messages_unacknowledged ?? 0,
    publishRate: queue.message_stats?.publish_details?.rate ?? 0,
    deliverRate:
      queue.message_stats?.deliver_details?.rate ??
      queue.message_stats?.deliver_get_details?.rate ??
      0,
    memory: queue.memory ?? null,
    state: queue.state ?? "unknown",
    connections: consumers.map((c) => ({
      consumerTag: c.consumer_tag,
      channelDetails: c.channel_details
        ? {
            connectionName: c.channel_details.connection_name ?? "",
            channelNumber: c.channel_details.number ?? 0,
          }
        : null,
      clientProperties: c.arguments ?? {},
      connectedAt: null,
      channelCount: null,
    })),
  };
}

export async function fetchMasters(): Promise<Master[]> {
  const bindings = await rabbitFetch<RabbitBinding[]>("/bindings/%2F");

  return bindings
    .filter(
      (b) =>
        b.source === "agent-rtc" && b.routing_key.startsWith("permission.")
    )
    .map((b) => ({
      agentId: b.routing_key.replace("permission.", ""),
      routingKey: b.routing_key,
      source: b.source,
      destination: b.destination,
    }));
}
