"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Agent, Stats } from "@/lib/types";

interface RightRailProps {
  stats: Stats;
  agents: Agent[];
}

export function RightRail({ stats, agents }: RightRailProps) {
  const onlineAgents = agents.filter((a) => a.online);

  return (
    <div className="flex flex-col gap-3">
      {/* System summary */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid var(--grey-100)",
          background: "#fff",
        }}
      >
        <CardHeader>
          <CardTitle
            className="text-sm font-semibold"
            style={{ color: "var(--fg-primary)" }}
          >
            System status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Total agents
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: "var(--fg-primary)" }}
            >
              {stats.agentCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Online
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: "var(--success-500)" }}
            >
              {onlineAgents.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Masters
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: "var(--fg-primary)" }}
            >
              {stats.masterCount}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Messages processed
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: "var(--fg-primary)" }}
            >
              {stats.messageCount}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Online agents list */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid var(--grey-100)",
          background: "#fff",
        }}
      >
        <CardHeader>
          <CardTitle
            className="text-sm font-semibold"
            style={{ color: "var(--fg-primary)" }}
          >
            Online agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlineAgents.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
              No agents online
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {onlineAgents.map((agent) => (
                <div
                  key={agent.agentId}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ background: "var(--grey-50)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "var(--success-500)" }}
                  />
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--fg-primary)" }}
                  >
                    {agent.displayName}
                  </span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px]"
                    style={{
                      background: "transparent",
                      color: "var(--fg-tertiary)",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    {agent.agentId}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
