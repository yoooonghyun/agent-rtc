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
}

export async function POST(req: NextRequest) {
  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { targetAgentId, text, senderName } = body;

  if (!targetAgentId || !text || !senderName) {
    return NextResponse.json(
      { error: "targetAgentId, text, and senderName are required" },
      { status: 400 },
    );
  }

  const redis = getRedis();

  try {
    await redis.connect();

    const timestamp = Date.now().toString();
    const data = JSON.stringify({
      type: "message",
      from: "console",
      fromDisplayName: senderName,
      to: targetAgentId,
      text,
      timestamp,
    });

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
