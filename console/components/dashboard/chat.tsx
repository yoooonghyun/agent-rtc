"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { useAgentStore } from "@/lib/stores";
import { sendMessage, fetchChatMessages } from "@/lib/api";
import { MentionInput } from "./mention-input";
import type { Agent, Message } from "@/lib/types";

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
  onReply,
}: {
  message: Message;
  isSent: boolean;
  onReply?: (agentId: string, displayName: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-1 group"
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
      <div className="flex items-center gap-2" style={{ padding: "0 4px" }}>
        <span
          className="text-xs tabular-nums"
          style={{ color: "var(--fg-tertiary)" }}
        >
          {formatTime(message.timestamp)}
        </span>
        {!isSent && onReply && (
          <button
            onClick={() =>
              onReply(
                message.sender,
                message.senderDisplayName || message.sender
              )
            }
            className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--brand)" }}
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export function Chat() {
  const agents = useAgentStore((s) => s.agents);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [sending, setSending] = React.useState(false);
  const [replyTarget, setReplyTarget] = React.useState<Agent | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = React.useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevCountRef = React.useRef(0);

  const isAllSelected = selectedAgentIds.size === 0;

  function toggleAgentFilter(agentId: string) {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      // If all online agents are now selected, reset to "All" mode
      const onlineIds = agents.filter((a) => a.online).map((a) => a.agentId);
      if (onlineIds.every((id) => next.has(id))) {
        return new Set();
      }
      return next;
    });
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelectedAgentIds(new Set(["__none__"]));
    } else {
      setSelectedAgentIds(new Set());
    }
  }

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  // Then filter by selected agents
  const sortedMessages = React.useMemo(() => {
    const reversed = [...messages].reverse();
    if (isAllSelected) return reversed;
    if (selectedAgentIds.has("__none__") && selectedAgentIds.size === 1) return [];
    return reversed.filter(
      (msg) => selectedAgentIds.has(msg.sender) || selectedAgentIds.has(msg.receiver)
    );
  }, [messages, selectedAgentIds, isAllSelected]);

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

  function handleReply(agentId: string, displayName: string) {
    const agent = agents.find((a) => a.agentId === agentId);
    if (agent) {
      setReplyTarget(agent);
    } else {
      setReplyTarget({ agentId, displayName, online: true, messages: 0 });
    }
  }

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
        className="flex items-center px-5 gap-3 shrink-0"
        style={{
          height: 56,
          borderBottom: "1px solid var(--grey-100)",
        }}
      >
        <h2
          className="text-base font-semibold shrink-0"
          style={{ color: "var(--fg-primary)" }}
        >
          Chat
        </h2>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "var(--grey-50)",
              color: "var(--fg-secondary)",
              border: "1px solid var(--grey-100)",
            }}
          >
            {isAllSelected
              ? `All agents (${agents.filter((a) => a.online).length})`
              : `${selectedAgentIds.size} agent${selectedAgentIds.size !== 1 ? "s" : ""} selected`}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 2 }}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {filterOpen && (
            <div
              className="absolute top-full left-0 mt-1 py-1 z-20"
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
                border: "1px solid var(--grey-100)",
                minWidth: 200,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              <label
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--grey-50)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  className="accent-[var(--brand)]"
                  style={{ width: 14, height: 14 }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--fg-primary)" }}
                >
                  All
                </span>
              </label>
              <div style={{ height: 1, background: "var(--grey-100)", margin: "2px 0" }} />
              {agents
                .filter((a) => a.online)
                .map((agent) => {
                  const checked = isAllSelected || selectedAgentIds.has(agent.agentId);
                  return (
                    <label
                      key={agent.agentId}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--grey-50)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAgentFilter(agent.agentId)}
                        className="accent-[var(--brand)]"
                        style={{ width: 14, height: 14 }}
                      />
                      <span
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--fg-primary)" }}
                      >
                        <span
                          className="rounded-full shrink-0"
                          style={{
                            width: 6,
                            height: 6,
                            background: "var(--success-500)",
                          }}
                        />
                        {agent.displayName}
                      </span>
                    </label>
                  );
                })}
            </div>
          )}
        </div>
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
            onReply={handleReply}
          />
        ))}
      </div>

      {/* Input */}
      <MentionInput
        agents={agents}
        onSend={(targetAgentId, text) => {
          handleSend(targetAgentId, text);
          setReplyTarget(null);
        }}
        disabled={sending}
        initialTarget={replyTarget}
      />
    </div>
  );
}
