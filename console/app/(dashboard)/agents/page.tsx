"use client";

import { AgentList } from "@/components/dashboard/agent-list";
import { useAgentStore } from "@/lib/stores";

export default function AgentsPage() {
  const agents = useAgentStore((s) => s.agents);
  const loading = useAgentStore((s) => s.loading);
  const error = useAgentStore((s) => s.error);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--fg-primary)" }}
        >
          Agents
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-tertiary)" }}>
          View and inspect connected agents
        </p>
      </div>

      <AgentList agents={agents} loading={loading} error={error} />
    </div>
  );
}
