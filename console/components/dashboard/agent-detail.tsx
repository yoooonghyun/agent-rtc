"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AgentDetail } from "@/lib/types";

interface AgentDetailViewProps {
  detail: AgentDetail | null;
  loading: boolean;
  error: string | null;
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

export function AgentDetailView({
  detail,
  loading,
  error,
}: AgentDetailViewProps) {
  if (loading && !detail) {
    return (
      <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
        Loading detail...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm" style={{ color: "var(--up-500)" }}>
        {error}
      </p>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl">
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
          {detail.description && (
            <p
              className="text-sm mt-3"
              style={{ color: "var(--fg-secondary)" }}
            >
              {detail.description}
            </p>
          )}
          {detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {detail.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                  style={{
                    background: "var(--grey-50)",
                    color: "var(--fg-secondary)",
                    border: "1px solid var(--grey-100)",
                    fontWeight: 400,
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
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
  );
}
