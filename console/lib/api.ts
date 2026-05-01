import type { Agent, Master, RabbitQueue, RabbitBinding } from "./types";

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
