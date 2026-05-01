"use client";

import { useEffect, useCallback } from "react";
import { Shell, type NavId } from "@/components/dashboard/shell";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { AgentList } from "@/components/dashboard/agent-list";
import { MasterPool } from "@/components/dashboard/master-pool";
import { MessageLog } from "@/components/dashboard/message-log";
import { RightRail } from "@/components/dashboard/right-rail";
import {
  useAgentStore,
  useMasterStore,
  useMessageStore,
  useStats,
} from "@/lib/stores";
import { useState } from "react";

const POLL_INTERVAL = 5000;

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState<NavId>("overview");

  const agents = useAgentStore((s) => s.agents);
  const agentsLoading = useAgentStore((s) => s.loading);
  const agentsError = useAgentStore((s) => s.error);
  const fetchAgents = useAgentStore((s) => s.fetch);

  const masters = useMasterStore((s) => s.masters);
  const mastersLoading = useMasterStore((s) => s.loading);
  const mastersError = useMasterStore((s) => s.error);
  const fetchMasters = useMasterStore((s) => s.fetch);

  const messages = useMessageStore((s) => s.messages);
  const stats = useStats();

  const poll = useCallback(() => {
    fetchAgents();
    fetchMasters();
  }, [fetchAgents, fetchMasters]);

  // Initial fetch and polling
  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  const handleRemoveMaster = (agentId: string) => {
    // Placeholder for future API call to remove a master binding
    console.log("Remove master:", agentId);
  };

  const rightRail = <RightRail stats={stats} agents={agents} />;

  return (
    <Shell activeNav={activeNav} onNav={setActiveNav} rightRail={rightRail}>
      <div className="flex flex-col gap-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--fg-primary)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--fg-tertiary)" }}>
            Monitor your agent-rtc system in real time
          </p>
        </div>

        {/* Stats bar */}
        {(activeNav === "overview" || activeNav === "agents") && (
          <StatsBar stats={stats} />
        )}

        {/* Agent list */}
        {(activeNav === "overview" || activeNav === "agents") && (
          <AgentList
            agents={agents}
            loading={agentsLoading}
            error={agentsError}
          />
        )}

        {/* Master pool */}
        {(activeNav === "overview" || activeNav === "masters") && (
          <MasterPool
            masters={masters}
            loading={mastersLoading}
            error={mastersError}
            onRemove={handleRemoveMaster}
          />
        )}

        {/* Message log */}
        {(activeNav === "overview" || activeNav === "messages") && (
          <MessageLog messages={messages} />
        )}
      </div>
    </Shell>
  );
}
