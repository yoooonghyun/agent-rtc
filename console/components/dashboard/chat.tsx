"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { useAgentStore } from "@/lib/stores";
import { sendMessage, fetchChatMessages } from "@/lib/api";
import { MentionInput } from "./mention-input";
import type { Message } from "@/lib/types";

const CONSOLE_SENDER = "Console";
const CHAT_POLL_INTERVAL = 2000;

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

function ChatBubble({
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
      <span
        className="text-xs font-medium"
        style={{ color: "var(--fg-tertiary)", padding: "0 4px" }}
      >
        {isSent
          ? `To ${message.receiverDisplayName || message.receiver}`
          : `From ${message.senderDisplayName || message.sender}`}
      </span>
      <div
        className="px-4 py-2.5 text-sm prose prose-sm max-w-none"
        style={{
          borderRadius: 16,
          background: isSent ? "var(--brand)" : "var(--grey-50)",
          color: isSent ? "#fff" : "var(--fg-primary)",
          wordBreak: "break-word",
          lineHeight: 1.5,
          ["--tw-prose-body" as string]: isSent ? "#fff" : "var(--fg-primary)",
          ["--tw-prose-headings" as string]: isSent ? "#fff" : "var(--fg-primary)",
          ["--tw-prose-bold" as string]: isSent ? "#fff" : "var(--fg-primary)",
          ["--tw-prose-code" as string]: isSent ? "#dbeafe" : "var(--fg-secondary)",
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

export function Chat() {
  const agents = useAgentStore((s) => s.agents);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevCountRef = React.useRef(0);

  const pollChat = React.useCallback(async () => {
    try {
      const msgs = await fetchChatMessages();
      setMessages(msgs);
    } catch { /* ignore */ }
  }, []);

  // Poll chat messages
  React.useEffect(() => {
    pollChat();
    const id = setInterval(pollChat, CHAT_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [pollChat]);

  // Reverse messages (API returns newest first, we want oldest first)
  const sortedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages],
  );

  // Auto-scroll to bottom on new messages
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

  async function handleSend(targetAgentId: string, text: string) {
    setSending(true);
    try {
      await sendMessage(targetAgentId, text, CONSOLE_SENDER);
      // Immediately fetch to show the sent message
      await pollChat();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100vh - 64px - 40px)",
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
          Chat
        </h2>
        <span
          className="text-xs ml-3"
          style={{ color: "var(--fg-tertiary)" }}
        >
          {agents.filter((a) => a.online).length} agents online
        </span>
      </div>

      {/* Messages area */}
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
              No messages yet. Type @ to mention an agent and start a
              conversation.
            </p>
          </div>
        )}
        {sortedMessages.map((msg) => (
          <ChatBubble
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
      <MentionInput
        agents={agents}
        onSend={handleSend}
        disabled={sending}
      />
    </div>
  );
}
