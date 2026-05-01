"use client";

import { Shell } from "@/components/dashboard/shell";
import { RightRail } from "@/components/dashboard/right-rail";
import { DashboardProvider } from "@/components/dashboard/dashboard-provider";
import { useAgentStore, useStats } from "@/lib/stores";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agents = useAgentStore((s) => s.agents);
  const stats = useStats();

  return (
    <DashboardProvider>
      <Shell rightRail={<RightRail stats={stats} agents={agents} />}>
        {children}
      </Shell>
    </DashboardProvider>
  );
}
