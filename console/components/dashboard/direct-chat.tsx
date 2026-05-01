"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessage, fetchDirectMessages } from "@/lib/api";
import type { Message } from "@/lib/types";

const CONSOLE_SENDER = "Console";
const POLL_INTERVAL = 2000;

function formatTime(ts: string): string {
  try {
    const num = Number(ts);
    const d = isNaN(num) ? new Date(ts) : new Date(num);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function DirectChatBubble({
  message,
  isSent,
}: {
  message: Message;
  isSent: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1"
      style={{
        alignItems: isSent ? "flex-end" : "flex-start",
        maxWidth: "75%",
        alignSelf: isSent ? "flex-end" : "flex-start",
      }}
    >
      <div
        className="px-4 py-2.5 text-sm prose prose-sm max-w-none"
        style={{
          borderRadius: 16,
          background: isSent ? "var(--brand)" : "var(--grey-50)",
          color: isSent ? "#fff" : "var(--fg-primary)",
          wordBreak: "break-word",
          lineHeight: 1.5,
          ["--tw-prose-body" as string]: isSent ? "#fff" : "var(--fg-primary)",
          ["--tw-prose-headings" as string]: isSent
            ? "#fff"
            : "var(--fg-primary)",
          ["--tw-prose-bold" as string]: isSent ? "#fff" : "var(--fg-primary)",
          ["--tw-prose-code" as string]: isSent
            ? "#dbeafe"
            : "var(--fg-secondary)",
        }}
      >
        <ReactMarkdown>{message.text}</ReactMarkdown>
      </div>
      <span
        className="text-xs tabular-nums"
        style={{ color: "var(--fg-tertiary)", padding: "0 4px" }}
      >
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

export function DirectChat({
  agentId,
  agentDisplayName,
}: {
  agentId: string;
  agentDisplayName: string;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevCountRef = React.useRef(0);

  const pollMessages = React.useCallback(async () => {
    try {
      const msgs = await fetchDirectMessages(agentId);
      setMessages(msgs);
    } catch {
      /* ignore */
    }
  }, [agentId]);

  React.useEffect(() => {
    pollMessages();
    const id = setInterval(pollMessages, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [pollMessages]);

  const sortedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages]
  );

  React.useEffect(() => {
    if (sortedMessages.length !== prevCountRef.current) {
      prevCountRef.current = sortedMessages.length;
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [sortedMessages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await sendMessage(agentId, trimmed, CONSOLE_SENDER);
      setText("");
      await pollMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: 520,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid var(--grey-100)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-5 shrink-0"
        style={{
          height: 56,
          borderBottom: "1px solid var(--grey-100)",
        }}
      >
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Chat with {agentDisplayName}
        </h2>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
        style={{ minHeight: 0 }}
      >
        {sortedMessages.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ color: "var(--fg-tertiary)" }}
          >
            <p className="text-sm">
              No messages yet. Send a message to start the conversation.
            </p>
          </div>
        )}
        {sortedMessages.map((msg) => (
          <DirectChatBubble
            key={msg.id}
            message={msg}
            isSent={
              msg.sender === "console" ||
              msg.senderDisplayName === CONSOLE_SENDER
            }
          />
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--grey-100)" }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${agentDisplayName}...`}
          disabled={sending}
          className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
          style={{
            background: "var(--grey-50)",
            border: "1px solid var(--grey-100)",
            color: "var(--fg-primary)",
          }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
