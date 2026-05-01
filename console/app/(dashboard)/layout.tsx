"use client";

import { usePathname } from "next/navigation";
import { Shell } from "@/components/dashboard/shell";
import { RightRail } from "@/components/dashboard/right-rail";
import { DashboardProvider } from "@/components/dashboard/dashboard-provider";
import { useAgentStore, useStats } from "@/lib/stores";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const agents = useAgentStore((s) => s.agents);
  const stats = useStats();

  // Hide right rail on agent detail pages
  const isAgentDetail = /^\/agents\/[^/]+$/.test(pathname);
  const rightRail = isAgentDetail ? undefined : <RightRail stats={stats} agents={agents} />;

  return (
    <DashboardProvider>
      <Shell rightRail={rightRail}>
        {children}
      </Shell>
    </DashboardProvider>
  );
}
