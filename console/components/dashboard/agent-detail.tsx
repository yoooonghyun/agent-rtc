"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updateAgentMeta } from "@/lib/api";
import type { AgentDetail } from "@/lib/types";

interface AgentDetailViewProps {
  detail: AgentDetail | null;
  loading: boolean;
  error: string | null;
  onUpdated?: () => void;
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
  onUpdated,
}: AgentDetailViewProps) {
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  function startEditing() {
    if (!detail) return;
    setEditDisplayName(detail.displayName);
    setEditDescription(detail.description);
    setEditTags(detail.tags.join(", "));
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const tags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await updateAgentMeta(detail.agentId, {
        displayName: editDisplayName,
        description: editDescription,
        tags,
      });
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
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
          {editing ? (
            <div className="flex flex-col gap-4">
              <div>
                <label
                  className="text-xs font-medium mb-1 block"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  Display name
                </label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Display name"
                />
              </div>

              <div>
                <label
                  className="text-xs font-medium mb-1 block"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                />
              </div>

              <div>
                <label
                  className="text-xs font-medium mb-1 block"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  Tags (comma-separated)
                </label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {saveError && (
                <p
                  className="text-xs"
                  style={{ color: "var(--up-500)" }}
                >
                  {saveError}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--fg-primary)" }}
                >
                  Agent info
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  style={{ color: "var(--fg-tertiary)" }}
                  onClick={startEditing}
                >
                  Edit
                </Button>
              </div>
              <StatRow label="Display name" value={detail.displayName} />
              <Separator />
              <StatRow label="Agent ID" value={detail.agentId} />
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm" style={{ color: "var(--fg-tertiary)" }}>Status</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={detail.online ? "default" : "secondary"}
                    className="text-xs"
                    style={
                      detail.online
                        ? { background: "var(--success-50)", color: "var(--success-500)", border: "none" }
                        : { background: "var(--grey-100)", color: "var(--fg-tertiary)", border: "none" }
                    }
                  >
                    {detail.online ? "Online" : "Offline"}
                  </Badge>
                  {detail.isMaster && (
                    <Badge
                      variant="default"
                      className="text-xs"
                      style={{ background: "var(--toss-blue-50)", color: "var(--brand)", border: "none" }}
                    >
                      Master
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <StatRow label="Description" value={detail.description || "-"} />
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm" style={{ color: "var(--fg-tertiary)" }}>Tags</span>
                {detail.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 justify-end">
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
                ) : (
                  <span className="text-sm font-medium tabular-nums" style={{ color: "var(--fg-primary)" }}>-</span>
                )}
              </div>
            </>
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
