
import { useCallback, useEffect, useState } from "react";
import { AgentList } from "./agent-list";
import { MasterPool } from "./master-pool";
import { MessageLogView } from "./message-log";
import { StatsBar } from "./stats-bar";

export function Dashboard() {
  const [masters, setMasters] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshMasters = useCallback(async () => {
    try {
      const res = await fetch("/api/masters", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) setMasters(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshMasters();
    const id = setInterval(refreshMasters, 2000);
    return () => clearInterval(id);
  }, [mounted, refreshMasters]);

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

  if (!mounted) {
    return <p className="text-stone-gray">Loading...</p>;
  }

  return (
    <>
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
          masters={masters}
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
          <MasterPool masters={masters} />
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
    </>
  );
}
