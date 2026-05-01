import type { Agent, AgentDetail, Master, Message, Stats } from "./types";

async function redisFetch<T>(action: string, params?: Record<string, string>): Promise<T> {
  const url = new URL("/api/redis", window.location.origin);
  url.searchParams.set("action", action);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Redis API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAgents(): Promise<Agent[]> {
  return redisFetch<Agent[]>("agents");
}

export async function fetchMasters(): Promise<Master[]> {
  return redisFetch<Master[]>("masters");
}

export async function fetchMessages(): Promise<Message[]> {
  return redisFetch<Message[]>("messages");
}

export async function fetchChatMessages(): Promise<Message[]> {
  return redisFetch<Message[]>("chat-messages");
}

export async function fetchDirectMessages(agentId: string): Promise<Message[]> {
  return redisFetch<Message[]>("direct-messages", { agentId });
}

export async function fetchAgentDetail(agentId: string): Promise<AgentDetail> {
  return redisFetch<AgentDetail>("agent-detail", { agentId });
}

export async function fetchStats(): Promise<Stats> {
  return redisFetch<Stats>("stats");
}

export async function sendMessage(
  targetAgentId: string,
  text: string,
  senderName: string,
): Promise<{ ok: boolean; timestamp: string }> {
  const res = await fetch("/api/redis/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetAgentId, text, senderName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Send error: ${res.status}`);
  }
  return res.json();
}
