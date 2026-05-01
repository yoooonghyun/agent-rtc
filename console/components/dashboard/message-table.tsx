"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Message } from "@/lib/types";

interface MessageTableProps {
  messages: Message[];
  maxRows?: number;
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

export function MessageTable({ messages, maxRows }: MessageTableProps) {
  const rows = maxRows ? messages.slice(0, maxRows) : messages;

  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
        No messages
      </p>
    );
  }

  return (
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
        {rows.map((msg) => (
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
              className="text-sm max-w-xs relative"
              style={{ color: "var(--fg-primary)" }}
              onMouseEnter={(e) => {
                const cell = e.currentTarget;
                const tip = cell.querySelector("[data-tip]") as HTMLElement;
                if (tip) {
                  const rect = cell.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  tip.style.left = `${x}px`;
                  tip.style.display = "block";
                }
              }}
              onMouseLeave={(e) => {
                const tip = e.currentTarget.querySelector("[data-tip]") as HTMLElement;
                if (tip) tip.style.display = "none";
              }}
            >
              <span className="block truncate cursor-default">
                {truncate(msg.text, 80)}
              </span>
              {msg.text.length > 80 && (
                <div
                  data-tip=""
                  className="absolute z-50 hidden max-w-md whitespace-pre-wrap text-sm px-3 py-2 rounded-lg"
                  style={{
                    top: "calc(100% + 4px)",
                    background: "var(--fg-primary)",
                    color: "#fff",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    pointerEvents: "none",
                  }}
                >
                  {msg.text}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
