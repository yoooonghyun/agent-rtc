import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

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

    // Write to the target agent's stream
    await redis.xadd("agent-rtc:agent:" + targetAgentId, "*", "data", data);

    // Write to the global message log stream
    await redis.xadd("agent-rtc:messages", "*", "data", data);

    return NextResponse.json({ ok: true, timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redis error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    redis.disconnect();
  }
}
