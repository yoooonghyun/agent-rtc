import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import { dualXadd } from "@/lib/redis-lua";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

function getRedis() {
  return new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
}

interface SendBody {
  targetAgentId: string;
  text: string;
  senderName: string;
  metadata?: Record<string, string>;
}

interface SendPayload {
  type: "message";
  from: "console";
  fromDisplayName: string;
  to: string;
  text: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

/** Validate that an unknown value is a `Record<string, string>`. */
function isStringMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "string") return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { targetAgentId, text, senderName, metadata } = body;

  if (!targetAgentId || !text || !senderName) {
    return NextResponse.json(
      { error: "targetAgentId, text, and senderName are required" },
      { status: 400 },
    );
  }

  if (metadata !== undefined && !isStringMap(metadata)) {
    return NextResponse.json(
      { error: "metadata must be an object whose values are all strings" },
      { status: 400 },
    );
  }

  const redis = getRedis();

  try {
    await redis.connect();

    const timestamp = Date.now().toString();
    const payload: SendPayload = {
      type: "message",
      from: "console",
      fromDisplayName: senderName,
      to: targetAgentId,
      text,
      timestamp,
    };
    if (metadata && Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }
    const data = JSON.stringify(payload);

    // Atomically write to target agent stream + global messages stream
    await dualXadd(redis, "agent-rtc:agent:" + targetAgentId, "agent-rtc:messages", "10000", data);

    return NextResponse.json({ ok: true, timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redis error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    redis.disconnect();
  }
}
