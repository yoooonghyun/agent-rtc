"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageTable } from "./message-table";
import type { Message } from "@/lib/types";

interface PaginatedMessageCardProps {
  title: string;
  fetchMessages: (page: number, pageSize: number) => Promise<{ messages: Message[]; total: number }>;
  pageSize?: number;
  refreshInterval?: number;
}

export function PaginatedMessageCard({
  title,
  fetchMessages,
  pageSize = 20,
  refreshInterval = 5000,
}: PaginatedMessageCardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    try {
      const data = await fetchMessages(page, pageSize);
      setMessages(data.messages);
      setTotal(data.total);
    } catch {
      // silently ignore refresh errors
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, refreshInterval);
    return () => clearInterval(interval);
  }, [load, refreshInterval]);

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
          {title}
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
        {loading && messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Loading messages...
          </p>
        ) : (
          <MessageTable messages={messages} />
        )}
      </CardContent>
    </Card>
  );
}
