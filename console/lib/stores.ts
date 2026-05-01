import { create } from "zustand";
import type { Agent, Master, Message, Stats } from "./types";
import { fetchAgents, fetchMasters, fetchMessages } from "./api";

// --- Agent store ---

interface AgentStore {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const agents = await fetchAgents();
      set({ agents, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch agents",
        loading: false,
      });
    }
  },
}));

// --- Master store ---

interface MasterStore {
  masters: Master[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useMasterStore = create<MasterStore>((set) => ({
  masters: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const masters = await fetchMasters();
      set({ masters, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch masters",
        loading: false,
      });
    }
  },
}));

// --- Message store (now fetches from Redis stream) ---

interface MessageStore {
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const messages = await fetchMessages();
      set({ messages, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch messages",
        loading: false,
      });
    }
  },
}));

// --- Derived stats ---

export function useStats(): Stats {
  const agentCount = useAgentStore((s) => s.agents.length);
  const masterCount = useMasterStore((s) => s.masters.length);
  const messageCount = useMessageStore((s) => s.messages.length);
  return { agentCount, masterCount, messageCount };
}
