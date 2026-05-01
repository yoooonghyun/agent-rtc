"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
              className="text-sm max-w-xs"
              style={{ color: "var(--fg-primary)" }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="block truncate cursor-default">
                      {truncate(msg.text, 80)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-md whitespace-pre-wrap text-sm"
                  >
                    {msg.text}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
