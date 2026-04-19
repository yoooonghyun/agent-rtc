"use client";

import { useCallback } from "react";
import { usePoll } from "./hooks/use-poll";
import { AgentList } from "./components/agent-list";
import { MasterPool } from "./components/master-pool";
import { MessageLogView } from "./components/message-log";
import { StatsBar } from "./components/stats-bar";

export default function Dashboard() {
  const { data: masters, refresh: refreshMasters } = usePoll<string[]>("/api/masters");

  const addMaster = useCallback(
    async (agentId: string) => {
      await fetch("/api/masters/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ masterAgentId: agentId }),
      });
      refreshMasters();
    },
    [refreshMasters]
  );

  const removeMaster = useCallback(
    async (agentId: string) => {
      await fetch("/api/masters/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ masterAgentId: agentId }),
      });
      refreshMasters();
    },
    [refreshMasters]
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-medium leading-tight text-near-black">
          Agent RTC
        </h1>
        <p className="mt-2 text-olive-gray">
          Real-time communication broker for inter-agent messaging
        </p>
      </header>

      {/* Stats */}
      <section className="mb-10 rounded-large border border-border-cream bg-ivory p-6 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
        <StatsBar />
      </section>

      {/* Agents */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-medium text-near-black">
          Agents
        </h2>
        <AgentList
          masters={masters ?? []}
          onAddMaster={addMaster}
          onRemoveMaster={removeMaster}
        />
      </section>

      {/* Master Pool */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-medium text-near-black">
          Master Pool
        </h2>
        <div className="rounded-comfortable border border-border-cream bg-ivory p-4">
          <MasterPool masters={masters ?? []} />
        </div>
      </section>

      {/* Messages */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-medium text-near-black">
          Recent Messages
        </h2>
        <div className="rounded-comfortable border border-border-cream bg-ivory p-4">
          <MessageLogView />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-cream pt-6 text-center text-xs text-stone-gray">
        MCP endpoint: <code className="font-mono text-olive-gray">/mcp?agentId=...&displayName=...</code>
      </footer>
    </div>
  );
}
