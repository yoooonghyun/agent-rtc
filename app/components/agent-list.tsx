"use client";

import { usePoll } from "../hooks/use-poll";

interface Agent {
  agentId: string;
  displayName: string;
}

interface AgentListProps {
  masters: string[];
  onAddMaster: (agentId: string) => void;
  onRemoveMaster: (agentId: string) => void;
}

export function AgentList({ masters, onAddMaster, onRemoveMaster }: AgentListProps) {
  const { data: agents, error } = usePoll<Agent[]>("/api/agents");

  if (error) {
    return <p className="text-error text-sm">Failed to load agents</p>;
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="rounded-comfortable border border-border-cream bg-ivory p-6 text-center">
        <p className="text-stone-gray text-sm">No agents registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {agents.map((agent) => {
        const isMaster = masters.includes(agent.agentId);
        return (
          <div
            key={agent.agentId}
            className="flex items-center justify-between rounded-comfortable border border-border-cream bg-ivory p-4 shadow-[0px_0px_0px_1px_var(--color-border-cream)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-2 w-2 rounded-full bg-terracotta"
                title="Online"
              />
              <div>
                <span className="font-serif font-medium text-near-black">
                  {agent.displayName}
                </span>
                <span className="ml-2 text-xs text-stone-gray">
                  {agent.agentId}
                </span>
              </div>
              {isMaster && (
                <span className="rounded-xl bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                  Master
                </span>
              )}
            </div>
            <button
              onClick={() =>
                isMaster
                  ? onRemoveMaster(agent.agentId)
                  : onAddMaster(agent.agentId)
              }
              className={`rounded-comfortable px-3 py-1.5 text-xs font-medium transition-colors ${
                isMaster
                  ? "bg-warm-sand text-charcoal-warm shadow-[0px_0px_0px_1px_var(--color-ring-warm)] hover:bg-border-warm"
                  : "bg-terracotta text-ivory shadow-[0px_0px_0px_1px_var(--color-terracotta)] hover:bg-coral"
              }`}
            >
              {isMaster ? "Remove Master" : "Add Master"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
