"use client";

import { usePoll } from "../hooks/use-poll";

interface Stats {
  agentCount: number;
  masterCount: number;
  totalMessages: number;
}

export function StatsBar() {
  const { data: stats } = usePoll<Stats>("/api/stats");

  const items = [
    { label: "Agents", value: stats?.agentCount ?? 0 },
    { label: "Masters", value: stats?.masterCount ?? 0 },
    { label: "Messages", value: stats?.totalMessages ?? 0 },
  ];

  return (
    <div className="flex gap-6">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="font-serif text-2xl font-medium text-near-black">
            {item.value}
          </div>
          <div className="text-xs text-stone-gray">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
