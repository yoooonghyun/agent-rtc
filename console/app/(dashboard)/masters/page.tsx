"use client";

import { MasterPool } from "@/components/dashboard/master-pool";
import { useMasterStore } from "@/lib/stores";

export default function MastersPage() {
  const masters = useMasterStore((s) => s.masters);
  const loading = useMasterStore((s) => s.loading);
  const error = useMasterStore((s) => s.error);

  const handleRemove = (agentId: string) => {
    console.log("Remove master:", agentId);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--fg-primary)" }}
        >
          Masters
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-tertiary)" }}>
          Manage the master pool and permission relay bindings
        </p>
      </div>

      <MasterPool
        masters={masters}
        loading={loading}
        error={error}
        onRemove={handleRemove}
      />
    </div>
  );
}
