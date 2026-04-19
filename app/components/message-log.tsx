"use client";

import { usePoll } from "../hooks/use-poll";

interface MessageLog {
  from: string;
  fromDisplayName: string;
  to: string;
  text: string;
  timestamp: number;
}

export function MessageLogView() {
  const { data: messages, error } = usePoll<MessageLog[]>("/api/messages");

  if (error) {
    return <p className="text-error text-sm">Failed to load messages</p>;
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="rounded-comfortable border border-border-cream bg-ivory p-6 text-center">
        <p className="text-stone-gray text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {[...messages].reverse().map((msg, i) => (
        <div
          key={`${msg.timestamp}-${i}`}
          className="flex items-start gap-3 border-t border-border-cream py-3 first:border-t-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-near-black">
                {msg.fromDisplayName}
              </span>
              <span className="text-xs text-stone-gray">
                {msg.from}
              </span>
              <span className="text-xs text-ring-warm">&rarr;</span>
              <span className="text-xs text-stone-gray">{msg.to}</span>
              <span className="ml-auto text-xs text-ring-warm">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-olive-gray">
              {msg.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
