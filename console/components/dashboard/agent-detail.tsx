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

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRate(rate: number): string {
  return `${rate.toFixed(1)} msg/s`;
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

            {/* Queue stats */}
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
                  Queue stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <StatRow
                  label="Consumers"
                  value={String(detail.consumers)}
                />
                <Separator />
                <StatRow
                  label="Messages ready"
                  value={String(detail.messagesReady)}
                />
                <Separator />
                <StatRow
                  label="Messages unacknowledged"
                  value={String(detail.messagesUnacknowledged)}
                />
                <Separator />
                <StatRow
                  label="Publish rate"
                  value={formatRate(detail.publishRate)}
                />
                <Separator />
                <StatRow
                  label="Deliver rate"
                  value={formatRate(detail.deliverRate)}
                />
                <Separator />
                <StatRow
                  label="Memory"
                  value={formatBytes(detail.memory)}
                />
                <Separator />
                <StatRow label="Queue state" value={detail.state} />
              </CardContent>
            </Card>

            {/* Connections */}
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
                  Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                {detail.connections.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--fg-tertiary)" }}
                  >
                    No connections
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {detail.connections.map((conn, idx) => (
                      <div
                        key={conn.consumerTag || idx}
                        className="rounded-lg p-3"
                        style={{
                          background: "var(--grey-50)",
                          border: "1px solid var(--grey-100)",
                        }}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs"
                              style={{ color: "var(--fg-tertiary)" }}
                            >
                              Consumer tag
                            </span>
                            <code
                              className="text-xs"
                              style={{ color: "var(--fg-secondary)" }}
                            >
                              {conn.consumerTag}
                            </code>
                          </div>
                          {conn.channelDetails && (
                            <>
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--fg-tertiary)" }}
                                >
                                  Connection
                                </span>
                                <code
                                  className="text-xs"
                                  style={{ color: "var(--fg-secondary)" }}
                                >
                                  {conn.channelDetails.connectionName}
                                </code>
                              </div>
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--fg-tertiary)" }}
                                >
                                  Channel
                                </span>
                                <span
                                  className="text-xs tabular-nums"
                                  style={{ color: "var(--fg-secondary)" }}
                                >
                                  {conn.channelDetails.channelNumber}
                                </span>
                              </div>
                            </>
                          )}
                          {conn.connectedAt && (
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs"
                                style={{ color: "var(--fg-tertiary)" }}
                              >
                                Connected at
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: "var(--fg-secondary)" }}
                              >
                                {conn.connectedAt}
                              </span>
                            </div>
                          )}
                          {conn.channelCount !== null && (
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs"
                                style={{ color: "var(--fg-tertiary)" }}
                              >
                                Channels
                              </span>
                              <span
                                className="text-xs tabular-nums"
                                style={{ color: "var(--fg-secondary)" }}
                              >
                                {conn.channelCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
