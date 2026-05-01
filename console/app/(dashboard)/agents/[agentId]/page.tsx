"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentDetailView } from "@/components/dashboard/agent-detail";
import { DirectChat } from "@/components/dashboard/direct-chat";
import { fetchAgentDetail } from "@/lib/api";
import type { AgentDetail } from "@/lib/types";

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAgentDetail(agentId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch agent detail"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md hover:bg-[var(--grey-50)] transition-colors"
          style={{ color: "var(--fg-tertiary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to agents
        </Link>
      </div>

      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--fg-primary)" }}
        >
          Agent detail
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-tertiary)" }}>
          Inspect agent configuration and stream stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentDetailView detail={detail} loading={loading} error={error} />

        {detail && (
          <DirectChat
            agentId={agentId}
            agentDisplayName={detail.displayName}
          />
        )}
      </div>
    </div>
  );
}
