"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Users,
  Shield,
  MessageSquare,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "agents", label: "Agents", icon: Users },
  { id: "masters", label: "Masters", icon: Shield },
  { id: "messages", label: "Messages", icon: MessageSquare },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];

interface ShellProps {
  activeNav: NavId;
  onNav: (id: NavId) => void;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}

export function Shell({ activeNav, onNav, children, rightRail }: ShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--grey-50)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center px-6 gap-8"
        style={{
          height: 64,
          borderBottom: "1px solid var(--grey-100)",
          background: "#fff",
        }}
      >
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[22px] font-extrabold"
            style={{ color: "var(--brand)", letterSpacing: "-0.04em" }}
          >
            agent-rtc
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--fg-primary)" }}
          >
            console
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Activity size={16} style={{ color: "var(--success-500)" }} />
          <span
            className="text-xs font-medium"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Connected
          </span>
        </div>
      </header>

      <div
        className="flex mx-auto items-start"
        style={{ maxWidth: 1440 }}
      >
        {/* Left nav */}
        <nav
          className="shrink-0 py-5 px-3"
          style={{ width: 240 }}
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer border-none w-full text-left",
                  )}
                  style={{
                    background: active ? "var(--toss-blue-50)" : "transparent",
                    color: active ? "var(--brand)" : "var(--fg-secondary)",
                    fontFamily: "inherit",
                  }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main canvas */}
        <main className="flex-1 min-w-0 py-5 px-7">
          {children}
        </main>

        {/* Right rail */}
        {rightRail && (
          <aside
            className="shrink-0 py-5 pr-5"
            style={{ width: 320 }}
          >
            {rightRail}
          </aside>
        )}
      </div>
    </div>
  );
}
