"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { fetchAgentMessages } from "@/lib/api";
import type { Message } from "@/lib/types";

interface AgentMessageHistoryProps {
  agentId: string;
}

function formatTime(ts: string): string {
  try {
    const num = Number(ts);
    const d = isNaN(num) ? new Date(ts) : new Date(num);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export function AgentMessageHistory({ agentId }: AgentMessageHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    try {
      const data = await fetchAgentMessages(agentId, page, pageSize);
      setMessages(data.messages);
      setTotal(data.total);
    } catch {
      // silently ignore refresh errors
    } finally {
      setLoading(false);
    }
  }, [agentId, page]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <Card
      style={{
        borderRadius: 16,
        border: "1px solid var(--grey-100)",
        background: "#fff",
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle
          className="text-base font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Message history
          {total > 0 && (
            <span
              className="text-xs font-normal ml-2"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {page}/{totalPages}
            </span>
          )}
        </CardTitle>
        {total > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ minWidth: 32, padding: "4px 8px" }}
            >
              &lt;
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ minWidth: 32, padding: "4px 8px" }}
            >
              &gt;
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading && messages.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Loading messages...
          </p>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            No messages
          </p>
        )}

        {messages.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell
                      className="tabular-nums text-xs"
                      style={{ color: "var(--fg-tertiary)" }}
                    >
                      {formatTime(msg.timestamp)}
                    </TableCell>
                    <TableCell>
                      <code
                        className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{
                          background: "var(--grey-50)",
                          color: "var(--fg-tertiary)",
                        }}
                      >
                        {msg.type}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code
                        className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{
                          background: "var(--grey-50)",
                          color: "var(--fg-secondary)",
                        }}
                      >
                        {msg.senderDisplayName || msg.sender}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code
                        className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{
                          background: "var(--grey-50)",
                          color: "var(--fg-secondary)",
                        }}
                      >
                        {msg.receiverDisplayName || msg.receiver}
                      </code>
                    </TableCell>
                    <TableCell
                      className="text-sm max-w-xs truncate"
                      style={{ color: "var(--fg-primary)" }}
                    >
                      {truncate(msg.text, 80)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          </>
        )}
      </CardContent>
    </Card>
  );
}
