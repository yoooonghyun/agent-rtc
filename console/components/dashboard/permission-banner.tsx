"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";
import { fetchPermissions, sendPermissionVerdict } from "@/lib/api";
import type { PermissionRequest } from "@/lib/permission";

export function PermissionBanner() {
  const [requests, setRequests] = React.useState<PermissionRequest[]>([]);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const perms = await fetchPermissions();
        if (active) setRequests(perms);
      } catch {
        // Silently ignore polling errors
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleVerdict(
    agentId: string,
    requestId: string,
    allow: boolean,
  ) {
    setDismissed((prev) => new Set(prev).add(requestId));
    try {
      await sendPermissionVerdict(agentId, requestId, allow);
    } catch {
      // If it fails, un-dismiss so user can retry
      setDismissed((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  }

  const visible = requests.filter((r) => !dismissed.has(r.requestId));

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {visible.map((req) => (
        <Card
          key={req.requestId}
          style={{
            borderRadius: 12,
            border: "1px solid var(--grey-100)",
            background: "#fff",
          }}
        >
          <CardContent className="flex items-center gap-4 py-3 px-4">
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: 36,
                height: 36,
                background: "var(--warning-50, #fff7ed)",
                color: "var(--warning-500, #f59e0b)",
              }}
            >
              <ShieldAlert size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--fg-primary)" }}
                >
                  {req.agentName}
                </span>
                <Badge variant="secondary">{req.tool}</Badge>
              </div>
              <p
                className="text-xs truncate"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {req.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => handleVerdict(req.agentId, req.requestId, false)}
                style={{
                  background: "var(--destructive-50, #fef2f2)",
                  color: "var(--destructive-500, #ef4444)",
                  border: "1px solid var(--destructive-200, #fecaca)",
                }}
              >
                Deny
              </Button>
              <Button
                size="sm"
                onClick={() => handleVerdict(req.agentId, req.requestId, true)}
                style={{
                  background: "var(--success-50, #f0fdf4)",
                  color: "var(--success-600, #16a34a)",
                  border: "1px solid var(--success-200, #bbf7d0)",
                }}
              >
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
