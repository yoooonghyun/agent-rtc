"use client";

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
import type { Message } from "@/lib/types";

interface MessageLogProps {
  messages: Message[];
}

function formatTime(ts: string): string {
  try {
    const num = Number(ts);
    const d = isNaN(num) ? new Date(ts) : new Date(num);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export function MessageLog({ messages }: MessageLogProps) {
  return (
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
          Message log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            No messages yet
          </p>
        )}
        {messages.length > 0 && (
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
              {messages.slice(0, 50).map((msg) => (
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
                      {msg.receiver}
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
        )}
      </CardContent>
    </Card>
  );
}
