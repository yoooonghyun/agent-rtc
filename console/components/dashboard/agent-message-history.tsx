"use client";

import { useCallback } from "react";
import { PaginatedMessageCard } from "./paginated-message-card";
import { fetchAgentMessages } from "@/lib/api";

interface AgentMessageHistoryProps {
  agentId: string;
}

export function AgentMessageHistory({ agentId }: AgentMessageHistoryProps) {
  const fetchMessages = useCallback(
    async (page: number, pageSize: number) => {
      return fetchAgentMessages(agentId, page, pageSize);
    },
    [agentId]
  );

  return (
    <PaginatedMessageCard
      title="Message history"
      fetchMessages={fetchMessages}
    />
  );
}
