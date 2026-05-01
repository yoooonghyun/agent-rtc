"use client";

import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info } from "lucide-react";
import { PaginatedMessageCard } from "@/components/dashboard/paginated-message-card";
import { fetchAllMessages } from "@/lib/api";
import { useAgentStore } from "@/lib/stores";

export default function MessagesPage() {
  const agents = useAgentStore((s) => s.agents);

  const fetchMessages = useCallback(
    async (page: number, pageSize: number) => {
      return fetchAllMessages(page, pageSize);
    },
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--fg-primary)" }}
        >
          Messages
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-tertiary)" }}>
          Message log and stream statistics
        </p>
      </div>

      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{
          background: "var(--toss-blue-50)",
          border: "1px solid var(--grey-100)",
        }}
      >
        <Info
          size={16}
          className="shrink-0 mt-0.5"
          style={{ color: "var(--brand)" }}
        />
        <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
          Message log shows messages from the Redis stream.
        </p>
      </div>

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid var(--grey-100)",
          background: "#fff",
        }}
      >
        <CardHeader>
          <CardTitle
            className="text-base font-semibold"
            style={{ color: "var(--fg-primary)" }}
          >
            Stream stats by agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
              No agents found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Messages in stream</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.agentId}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
                          {agent.displayName}
                        </span>
                        <code className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                          {agent.agentId}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums" style={{ color: "var(--fg-secondary)" }}>
                      {agent.messages}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs font-medium"
                        style={{ color: agent.online ? "var(--success-500)" : "var(--fg-tertiary)" }}
                      >
                        {agent.online ? "Online" : "Offline"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginatedMessageCard
        title="Message log"
        fetchMessages={fetchMessages}
      />
    </div>
  );
}
