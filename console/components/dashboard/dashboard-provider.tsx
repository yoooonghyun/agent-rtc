"use client";

import { useEffect, useCallback } from "react";
import { useAgentStore, useMasterStore } from "@/lib/stores";

const POLL_INTERVAL = 5000;

/**
 * Starts polling for agents and masters on mount.
 * Renders nothing — mount once in the dashboard layout.
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const fetchAgents = useAgentStore((s) => s.fetch);
  const fetchMasters = useMasterStore((s) => s.fetch);

  const poll = useCallback(() => {
    fetchAgents();
    fetchMasters();
  }, [fetchAgents, fetchMasters]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  return <>{children}</>;
}
