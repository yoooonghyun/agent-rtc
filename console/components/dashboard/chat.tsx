"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { useAgentStore } from "@/lib/stores";
import { ZIndex } from "@/lib/z-index";
import { sendPermissionVerdict } from "@/lib/api";
import { sendMessage, fetchChatMessages } from "@/lib/api";
import { MentionInput } from "./mention-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

function PermissionBubble({
  message,
  onApprove,
  onDeny,
  respondedVerdict,
}: {
  message: Message;
  onApprove?: (agentId: string, requestId: string) => void;
  onDeny?: (agentId: string, requestId: string) => void;
  respondedVerdict?: "approved" | "denied" | null;
}) {
  const isRequest = message.type === "permission_request";
  const isResponse = message.type === "permission_response";
  const isApproved = isResponse && message.text.startsWith("Approved");
  const isSent = message.sender === "console";

  // Parse requestId from text for approve/deny buttons
  const requestIdMatch = message.text.match(/"(?:yes|no)\s+([a-km-z]{5})"/);
  const requestId = requestIdMatch?.[1] ?? "";

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
        className="px-4 py-3 text-sm"
        style={{
          borderRadius: 16,
          background: isResponse
            ? isApproved ? "var(--success-50)" : "var(--error-50)"
            : "var(--grey-50)",
          color: "var(--fg-primary)",
          wordBreak: "break-word",
          lineHeight: 1.5,
          border: `1px solid ${
            isResponse
              ? isApproved ? "var(--success-100)" : "var(--error-100)"
              : "var(--grey-100)"
          }`,
        }}
      >
        <ReactMarkdown>{message.text}</ReactMarkdown>
        {isRequest && requestId && respondedVerdict && (
          <div className="flex gap-2 mt-3">
            <Badge
              className="text-xs"
              style={{
                background: respondedVerdict === "approved" ? "var(--success-50)" : "var(--error-50)",
                color: respondedVerdict === "approved" ? "var(--success-500)" : "var(--error-500)",
                border: `1px solid ${respondedVerdict === "approved" ? "var(--success-100)" : "var(--error-100)"}`,
              }}
            >
              {respondedVerdict === "approved" ? "Approved" : "Denied"}
            </Badge>
          </div>
        )}
        {isRequest && onApprove && onDeny && requestId && !respondedVerdict && (
          <div className="flex gap-2 mt-3">
            <Button
              size="xs"
              onClick={() => onApprove(message.sender, requestId)}
              style={{
                background: "var(--success-500)",
                color: "var(--grey-0)",
                borderColor: "transparent",
              }}
            >
              Approve
            </Button>
            <Button
              size="xs"
              variant="destructive"
              onClick={() => onDeny(message.sender, requestId)}
              style={{
                background: "var(--error-500)",
                color: "var(--grey-0)",
                borderColor: "transparent",
              }}
            >
              Deny
            </Button>
          </div>
        )}
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
          color: isSent ? "var(--grey-0)" : "var(--fg-primary)",
          wordBreak: "break-word",
          lineHeight: 1.5,
          ["--tw-prose-body" as string]: isSent ? "var(--grey-0)" : "var(--fg-primary)",
          ["--tw-prose-headings" as string]: isSent ? "var(--grey-0)" : "var(--fg-primary)",
          ["--tw-prose-bold" as string]: isSent ? "var(--grey-0)" : "var(--fg-primary)",
          ["--tw-prose-code" as string]: isSent ? "var(--toss-blue-100)" : "var(--fg-secondary)",
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
  const [hasMore, setHasMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [replyTarget, setReplyTarget] = React.useState<Agent | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = React.useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [autoApprove, setAutoApprove] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevCountRef = React.useRef(0);
  const seenMessageIdsRef = React.useRef<Set<string>>(new Set());

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
      const result = await fetchChatMessages(50);
      setMessages((prev) => {
        if (prev.length === 0) return result.messages;
        // Merge: keep older messages that aren't in the new batch, then append new batch
        const newIds = new Set(result.messages.map((m) => m.id));
        const olderOnly = prev.filter((m) => !newIds.has(m.id));
        return [...result.messages, ...olderOnly];
      });
      setHasMore(result.hasMore);
    } catch { /* ignore */ }
  }, []);

  const loadOlder = React.useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldestId = messages[messages.length - 1].id;
      const prevScrollHeight = scrollRef.current?.scrollHeight ?? 0;
      const result = await fetchChatMessages(50, oldestId);
      if (result.messages.length > 0) {
        const existingIds = new Set(messages.map((m) => m.id));
        const newMsgs = result.messages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
          // Restore scroll position after older messages are added
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              const newScrollHeight = scrollRef.current.scrollHeight;
              scrollRef.current.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        }
        setHasMore(result.hasMore && newMsgs.length > 0);
      } else {
        setHasMore(false);
      }
    } catch { /* ignore */ }
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages]);

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

  // Build a map of requestId -> verdict from permission_response messages
  const respondedRequests = React.useMemo(() => {
    const map = new Map<string, "approved" | "denied">();
    for (const msg of messages) {
      if (msg.type === "permission_response") {
        // Match patterns like "yes {id}", "no {id}", "Approved...yes {id}", "Denied...no {id}"
        const yesMatch = msg.text.match(/yes\s+([a-km-z]{5})/);
        const noMatch = msg.text.match(/no\s+([a-km-z]{5})/);
        if (yesMatch) {
          map.set(yesMatch[1], "approved");
        } else if (noMatch) {
          map.set(noMatch[1], "denied");
        }
      }
    }
    return map;
  }, [messages]);

  // Auto-approve: when new permission_request messages arrive, auto-approve them
  const autoApproveRef = React.useRef(autoApprove);
  autoApproveRef.current = autoApprove;

  React.useEffect(() => {
    if (!autoApproveRef.current) return;
    for (const msg of messages) {
      if (
        msg.type === "permission_request" &&
        !seenMessageIdsRef.current.has(msg.id)
      ) {
        seenMessageIdsRef.current.add(msg.id);
        // Parse requestId from the request text
        const reqIdMatch = msg.text.match(/"(?:yes|no)\s+([a-km-z]{5})"/);
        const reqId = reqIdMatch?.[1];
        if (reqId && !respondedRequests.has(reqId)) {
          sendPermissionVerdict(msg.sender, reqId, true).then(() => pollChat());
        }
      }
    }
  }, [messages, respondedRequests, pollChat]);

  // Track seen message IDs (mark existing messages as seen on first load)
  React.useEffect(() => {
    for (const msg of messages) {
      seenMessageIdsRef.current.add(msg.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom only for new messages (not when loading older)
  React.useEffect(() => {
    const newCount = sortedMessages.length;
    const oldCount = prevCountRef.current;
    if (newCount !== oldCount) {
      // Only scroll to bottom if not loading older messages
      if (!loadingMore && scrollRef.current) {
        const el = scrollRef.current;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        if (isNearBottom || oldCount === 0) {
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
          });
        }
      }
      prevCountRef.current = newCount;
    }
  }, [sortedMessages.length, loadingMore]);

  async function handlePermissionApprove(agentId: string, requestId: string) {
    try {
      await sendPermissionVerdict(agentId, requestId, true);
      await pollChat();
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  }

  async function handlePermissionDeny(agentId: string, requestId: string) {
    try {
      await sendPermissionVerdict(agentId, requestId, false);
      await pollChat();
    } catch (err) {
      console.error("Failed to deny:", err);
    }
  }

  function handleReply(agentId: string, displayName: string) {
    const agent = agents.find((a) => a.agentId === agentId);
    if (agent) {
      setReplyTarget(agent);
    } else {
      setReplyTarget({ agentId, displayName, online: true, messages: 0, description: "", tags: [] });
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
        background: "var(--bg-surface)",
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

        {/* Auto-approve toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <label
            htmlFor="auto-approve-toggle"
            className="text-xs font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Auto-approve
          </label>
          <Switch
            id="auto-approve-toggle"
            size="sm"
            checked={autoApprove}
            onCheckedChange={(checked) => setAutoApprove(checked)}
          />
        </div>

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
              className="absolute top-full left-0 mt-1 py-1"
              style={{
                zIndex: ZIndex.dropdown,
                background: "var(--bg-surface)",
                borderRadius: 12,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
                border: "1px solid var(--grey-100)",
                minWidth: 200,
                maxHeight: 280,
                overflowY: "auto" as const,
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
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop === 0 && hasMore) {
            loadOlder();
          }
        }}
      >
        {loadingMore && (
          <p className="text-xs text-center" style={{ color: "var(--fg-tertiary)" }}>
            Loading older messages...
          </p>
        )}
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
        {sortedMessages.map((msg) => {
          if (msg.type === "permission_request" || msg.type === "permission_response") {
            // For requests, check if already responded
            let verdict: "approved" | "denied" | null = null;
            if (msg.type === "permission_request") {
              const reqIdMatch = msg.text.match(/"(?:yes|no)\s+([a-km-z]{5})"/);
              const reqId = reqIdMatch?.[1];
              if (reqId && respondedRequests.has(reqId)) {
                verdict = respondedRequests.get(reqId)!;
              }
            }
            return (
              <PermissionBubble
                key={msg.id}
                message={msg}
                onApprove={handlePermissionApprove}
                onDeny={handlePermissionDeny}
                respondedVerdict={verdict}
              />
            );
          }
          return (
            <ChatBubble
              key={msg.id}
              message={msg}
              isSent={
                msg.sender === "console" ||
                msg.senderDisplayName === CONSOLE_SENDER
              }
              onReply={handleReply}
            />
          );
        })}
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
