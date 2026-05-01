"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, MessageSquare } from "lucide-react";
import type { Stats } from "@/lib/types";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card
      className="flex-1"
      style={{
        borderRadius: 16,
        border: "1px solid var(--grey-100)",
        background: "#fff",
      }}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 40,
            height: 40,
            background: "var(--toss-blue-50)",
            color: "var(--brand)",
          }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-xs font-medium"
            style={{ color: "var(--fg-tertiary)" }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: "var(--fg-primary)" }}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsBarProps {
  stats: Stats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex gap-4">
      <StatCard
        label="Agents"
        value={stats.agentCount}
        icon={<Users size={20} />}
      />
      <StatCard
        label="Masters"
        value={stats.masterCount}
        icon={<Shield size={20} />}
      />
      <StatCard
        label="Messages"
        value={stats.messageCount}
        icon={<MessageSquare size={20} />}
      />
    </div>
  );
}
