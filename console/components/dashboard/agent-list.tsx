"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Agent } from "@/lib/types";

interface AgentListProps {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

export function AgentList({ agents, loading, error }: AgentListProps) {
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
          Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm" style={{ color: "var(--up-500)" }}>
            {error}
          </p>
        )}
        {loading && agents.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Loading agents...
          </p>
        )}
        {!loading && !error && agents.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            No agents found
          </p>
        )}
        {agents.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent ID</TableHead>
                <TableHead>Display name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Messages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.agentId} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="block"
                    >
                      <code
                        className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{
                          background: "var(--grey-50)",
                          color: "var(--fg-secondary)",
                        }}
                      >
                        {agent.agentId}
                      </code>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="block"
                    >
                      <div className="flex flex-col gap-1">
                        <span style={{ color: "var(--fg-primary)" }}>
                          {agent.displayName}
                        </span>
                        {agent.description && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--fg-tertiary)" }}
                          >
                            {agent.description}
                          </span>
                        )}
                        {agent.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {agent.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                                style={{
                                  background: "var(--grey-50)",
                                  color: "var(--fg-secondary)",
                                  border: "1px solid var(--grey-100)",
                                  fontWeight: 400,
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="block"
                    >
                      <Badge
                        variant={agent.online ? "default" : "secondary"}
                        className="text-xs"
                        style={
                          agent.online
                            ? {
                                background: "var(--success-50)",
                                color: "var(--success-500)",
                                border: "none",
                              }
                            : {
                                background: "var(--grey-100)",
                                color: "var(--fg-tertiary)",
                                border: "none",
                              }
                        }
                      >
                        {agent.online ? "Online" : "Offline"}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    style={{ color: "var(--fg-secondary)" }}
                  >
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="block"
                    >
                      {agent.messages}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
