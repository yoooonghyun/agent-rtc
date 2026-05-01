"use client";

import { useEffect, useCallback } from "react";
import { useAgentStore, useMasterStore, useMessageStore } from "@/lib/stores";

const POLL_INTERVAL = 5000;

/**
 * Starts polling for agents, masters, and messages on mount.
 * Renders nothing — mount once in the dashboard layout.
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const fetchAgents = useAgentStore((s) => s.fetch);
  const fetchMasters = useMasterStore((s) => s.fetch);
  const fetchMessages = useMessageStore((s) => s.fetch);

  const poll = useCallback(() => {
    fetchAgents();
    fetchMasters();
    fetchMessages();
  }, [fetchAgents, fetchMasters, fetchMessages]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  return <>{children}</>;
}
