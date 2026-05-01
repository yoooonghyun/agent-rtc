"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AgentDetail } from "@/lib/types";

interface AgentDetailPanelProps {
  detail: AgentDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className="text-sm"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium tabular-nums"
        style={{ color: "var(--fg-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

export function AgentDetailPanel({
  detail,
  loading,
  error,
  onClose,
}: AgentDetailPanelProps) {
  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col"
      style={{
        width: 420,
        background: "#fff",
        borderLeft: "1px solid var(--grey-100)",
        boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid var(--grey-100)" }}
      >
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Agent detail
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-sm"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Close
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && !detail && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Loading detail...
          </p>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--up-500)" }}>
            {error}
          </p>
        )}

        {detail && (
          <div className="flex flex-col gap-5">
            {/* Identity */}
            <Card
              style={{
                borderRadius: 16,
                border: "1px solid var(--grey-100)",
                background: "#fff",
              }}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--fg-primary)" }}
                  >
                    {detail.displayName}
                  </span>
                  <Badge
                    variant={detail.online ? "default" : "secondary"}
                    className="text-xs"
                    style={
                      detail.online
                        ? {
                            background: "var(--success-50)",
                            color: "var(--success-500)",
                            border: "none",
                          }
                        : {
                            background: "var(--grey-100)",
                            color: "var(--fg-tertiary)",
                            border: "none",
                          }
                    }
                  >
                    {detail.online ? "Online" : "Offline"}
                  </Badge>
                  {detail.isMaster && (
                    <Badge
                      variant="default"
                      className="text-xs"
                      style={{
                        background: "var(--toss-blue-50)",
                        color: "var(--brand)",
                        border: "none",
                      }}
                    >
                      Master
                    </Badge>
                  )}
                </div>
                <code
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{
                    background: "var(--grey-50)",
                    color: "var(--fg-secondary)",
                  }}
                >
                  {detail.agentId}
                </code>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card
              style={{
                borderRadius: 16,
                border: "1px solid var(--grey-100)",
                background: "#fff",
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-sm font-semibold"
                  style={{ color: "var(--fg-primary)" }}
                >
                  Stream stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <StatRow
                  label="Messages in stream"
                  value={String(detail.messageCount)}
                />
                <Separator />
                <StatRow
                  label="Presence status"
                  value={detail.online ? "Online" : "Offline"}
                />
                {detail.online && detail.presenceTtl > 0 && (
                  <>
                    <Separator />
                    <StatRow
                      label="Presence TTL"
                      value={`${detail.presenceTtl}s`}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
