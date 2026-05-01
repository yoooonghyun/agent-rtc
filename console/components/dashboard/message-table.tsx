"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ZIndex } from "@/lib/z-index";
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
    <>
    <div
      id="msg-tooltip"
      className="whitespace-pre-wrap text-sm px-3 py-2 rounded-lg"
      style={{
        display: "none",
        position: "fixed",
        zIndex: ZIndex.tooltip,
        maxWidth: 400,
        background: "var(--fg-primary)",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        pointerEvents: "none",
      }}
    />
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
              className="text-sm max-w-xs"
              style={{ color: "var(--fg-primary)" }}
              onMouseEnter={(e) => {
                const span = e.currentTarget.querySelector("span");
                const isOverflowing = span
                  ? span.scrollWidth > span.clientWidth || msg.text.length > 80
                  : msg.text.length > 80;
                if (!isOverflowing) return;
                const tip = document.getElementById("msg-tooltip");
                if (tip) {
                  tip.textContent = msg.text;
                  tip.style.display = "block";
                  tip.style.left = `${e.clientX}px`;
                  tip.style.top = `${e.clientY + 12}px`;
                }
              }}
              onMouseLeave={() => {
                const tip = document.getElementById("msg-tooltip");
                if (tip) tip.style.display = "none";
              }}
            >
              <span className="block truncate cursor-default">
                {truncate(msg.text, 80)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </>
  );
}
