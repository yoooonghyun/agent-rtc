"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";
import type { Master } from "@/lib/types";

interface MasterPoolProps {
  masters: Master[];
  loading: boolean;
  error: string | null;
  onRemove?: (agentId: string) => void;
}

export function MasterPool({
  masters,
  loading,
  error,
  onRemove,
}: MasterPoolProps) {
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
          Master pool
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm" style={{ color: "var(--up-500)" }}>
            {error}
          </p>
        )}
        {loading && masters.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Loading masters...
          </p>
        )}
        {!loading && !error && masters.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            No masters registered
          </p>
        )}
        {masters.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent ID</TableHead>
                <TableHead>Routing key</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {masters.map((master) => (
                <TableRow key={master.agentId}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        background: "var(--toss-blue-50)",
                        color: "var(--brand)",
                        border: "none",
                      }}
                    >
                      {master.agentId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code
                      className="text-xs px-1.5 py-0.5 rounded-md"
                      style={{
                        background: "var(--grey-50)",
                        color: "var(--fg-secondary)",
                      }}
                    >
                      {master.routingKey}
                    </code>
                  </TableCell>
                  <TableCell style={{ color: "var(--fg-secondary)" }}>
                    {master.destination}
                  </TableCell>
                  <TableCell className="text-right">
                    {onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(master.agentId)}
                        className="h-7 w-7 cursor-pointer"
                        style={{ color: "var(--fg-tertiary)" }}
                      >
                        <X size={14} />
                      </Button>
                    )}
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
