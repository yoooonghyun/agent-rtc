"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  Users,
  Shield,
  MessageSquare,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/masters", label: "Masters", icon: Shield },
  { href: "/messages", label: "Messages", icon: MessageSquare },
] as const;

interface ShellProps {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}

export function Shell({ children, rightRail }: ShellProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

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
        <Link href="/" className="flex items-center gap-2 no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-agentrtc.svg"
            alt="Agent RTC"
            height={32}
            style={{ height: 32, width: "auto" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--fg-tertiary)" }}
          >
            console
          </span>
        </Link>
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
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors no-underline",
                  )}
                  style={{
                    background: active ? "var(--toss-blue-50)" : "transparent",
                    color: active ? "var(--brand)" : "var(--fg-secondary)",
                  }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {item.label}
                </Link>
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
