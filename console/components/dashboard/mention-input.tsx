"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { Agent } from "@/lib/types";

interface MentionInputProps {
  agents: Agent[];
  onSend: (targetAgentId: string, text: string) => void;
  disabled?: boolean;
  initialTarget?: Agent | null;
}

export function MentionInput({ agents, onSend, disabled, initialTarget }: MentionInputProps) {
  const [value, setValue] = React.useState("");
  const [targetAgent, setTargetAgent] = React.useState<Agent | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialTarget) {
      setTargetAgent(initialTarget);
      inputRef.current?.focus();
    }
  }, [initialTarget]);

  const onlineAgents = React.useMemo(
    () => agents.filter((a) => a.online),
    [agents],
  );

  const filteredAgents = React.useMemo(() => {
    if (!mentionQuery) return onlineAgents;
    const q = mentionQuery.toLowerCase();
    return onlineAgents.filter((a) =>
      a.displayName.toLowerCase().includes(q),
    );
  }, [onlineAgents, mentionQuery]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredAgents.length]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setValue(val);

    // Detect @mention trigger
    const atIndex = val.lastIndexOf("@");
    if (atIndex !== -1) {
      const afterAt = val.slice(atIndex + 1);
      // Only show dropdown if @ is not followed by a space-terminated name
      if (!afterAt.includes(" ") || afterAt.trim() === "") {
        setMentionQuery(afterAt);
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
  }

  function selectAgent(agent: Agent) {
    const atIndex = value.lastIndexOf("@");
    const before = atIndex >= 0 ? value.slice(0, atIndex) : value;
    setValue(before.trim() ? before.trim() + " " : "");
    setTargetAgent(agent);
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showDropdown && filteredAgents.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredAgents.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectAgent(filteredAgents[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }

    if (e.key === "Enter" && !showDropdown) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    if (!targetAgent || disabled) return;
    const text = value.trim();
    if (!text) return;

    onSend(targetAgent.agentId, text);
    setValue("");
    setTargetAgent(null);
  }

  const canSend = targetAgent !== null && value.trim().length > 0 && !disabled;

  return (
    <div className="relative">
      {/* Mention dropdown */}
      {showDropdown && filteredAgents.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden"
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            border: "1px solid var(--grey-100)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {filteredAgents.map((agent, i) => (
            <button
              key={agent.agentId}
              type="button"
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
              style={{
                background:
                  i === selectedIndex ? "var(--grey-50)" : "transparent",
                color: "var(--fg-primary)",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                selectAgent(agent);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: agent.online
                    ? "var(--success-500)"
                    : "var(--grey-300)",
                }}
              />
              <span className="text-sm font-medium">{agent.displayName}</span>
              <span
                className="text-xs ml-auto"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {agent.agentId}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: "#fff",
          borderTop: "1px solid var(--grey-100)",
        }}
      >
        {targetAgent && (
          <span
            className="shrink-0 text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: "var(--toss-blue-50)",
              color: "var(--brand)",
            }}
          >
            @{targetAgent.displayName}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow dropdown click
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder={
            targetAgent
              ? "Type a message..."
              : "Type @ to mention an agent..."
          }
          disabled={disabled}
          className="flex-1 text-sm outline-none"
          style={{
            color: "var(--fg-primary)",
            background: "transparent",
          }}
        />
        <Button
          size="sm"
          disabled={!canSend}
          onClick={handleSend}
          style={{
            borderRadius: 10,
            background: canSend ? "var(--brand)" : "var(--grey-100)",
            color: canSend ? "#fff" : "var(--fg-tertiary)",
          }}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
