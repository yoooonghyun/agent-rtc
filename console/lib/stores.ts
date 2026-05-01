import { create } from "zustand";
import type { Agent, Master, Message, Stats } from "./types";
import { fetchAgents, fetchMasters } from "./api";

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

// --- Message store (placeholder — messages from a future API or local tracking) ---

interface MessageStore {
  messages: Message[];
  addMessage: (msg: Message) => void;
  clear: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [msg, ...state.messages].slice(0, 100),
    })),
  clear: () => set({ messages: [] }),
}));

// --- Derived stats ---

export function useStats(): Stats {
  const agentCount = useAgentStore((s) => s.agents.length);
  const masterCount = useMasterStore((s) => s.masters.length);
  const messageCount = useMessageStore((s) => s.messages.length);
  return { agentCount, masterCount, messageCount };
}
