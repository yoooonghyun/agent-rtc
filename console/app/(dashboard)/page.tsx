"use client";

import { StatsBar } from "@/components/dashboard/stats-bar";
import { useAgentStore, useMasterStore, useStats } from "@/lib/stores";

export default function OverviewPage() {
  const stats = useStats();
  const agents = useAgentStore((s) => s.agents);
  const masters = useMasterStore((s) => s.masters);
  const onlineCount = agents.filter((a) => a.online).length;

  return (
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

      <StatsBar stats={stats} />

      {/* Brief summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid var(--grey-100)",
          }}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--fg-primary)" }}
          >
            Agents
          </p>
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            {agents.length} registered, {onlineCount} online
          </p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid var(--grey-100)",
          }}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--fg-primary)" }}
          >
            Masters
          </p>
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            {masters.length} registered
          </p>
        </div>
      </div>
    </div>
  );
}
