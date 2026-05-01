"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageTable } from "./message-table";
import type { Message } from "@/lib/types";

interface MessageLogProps {
  messages: Message[];
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
        <MessageTable messages={messages} maxRows={50} />
      </CardContent>
    </Card>
  );
}
