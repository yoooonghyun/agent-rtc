import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

function getRedis() {
  return new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  if (!action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const redis = getRedis();

  try {
    await redis.connect();

    switch (action) {
      case "agents": {
        const agentIds = await redis.smembers("agent-rtc:agents");
        const agents = [];
        for (const agentId of agentIds) {
          const online = (await redis.exists(`agent-rtc:presence:${agentId}`)) === 1;
          if (!online) {
            // Sweep stale agent
            await redis.srem("agent-rtc:agents", agentId);
            await redis.del(`agent-rtc:meta:${agentId}`);
            await redis.srem("agent-rtc:masters", agentId);
            continue;
          }
          const meta = await redis.hgetall(`agent-rtc:meta:${agentId}`);
          const streamLen = await redis.xlen(`agent-rtc:agent:${agentId}`);
          let tags: string[] = [];
          try {
            tags = meta.tags ? JSON.parse(meta.tags) : [];
          } catch {
            tags = [];
          }
          agents.push({
            agentId,
            displayName: meta.displayName || agentId,
            online,
            messages: streamLen,
            description: meta.description || "",
            tags,
          });
        }
        return NextResponse.json(agents);
      }

      case "masters": {
        const masterIds = await redis.smembers("agent-rtc:masters");
        return NextResponse.json(masterIds.map((id) => ({ agentId: id })));
      }

      case "messages": {
        const entries = await redis.xrevrange("agent-rtc:messages", "+", "-", "COUNT", 100);
        const messages = await Promise.all(
          entries.map(async ([id, fields]) => {
            const fieldMap: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              fieldMap[fields[i]] = fields[i + 1];
            }
            const data = fieldMap.data ? JSON.parse(fieldMap.data) : {};
            const receiverMeta = data.to
              ? await redis.hgetall(`agent-rtc:meta:${data.to}`)
              : {};
            return {
              id,
              type: data.type || "message",
              sender: data.from || "",
              senderDisplayName: data.fromDisplayName || data.from || "",
              receiver: data.to || "",
              receiverDisplayName: receiverMeta.displayName || data.to || "",
              text: data.text || "",
              timestamp: data.timestamp || id.split("-")[0],
            };
          })
        );
        return NextResponse.json(messages);
      }

      case "chat-messages": {
        const chatEntries = await redis.xrevrange("agent-rtc:messages", "+", "-", "COUNT", 200);
        const chatMessages = [];
        for (const [id, fields] of chatEntries) {
          const fieldMap: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            fieldMap[fields[i]] = fields[i + 1];
          }
          const data = fieldMap.data ? JSON.parse(fieldMap.data) : {};
          if (data.from !== "console" && data.to !== "console") continue;
          const receiverMeta = data.to
            ? await redis.hgetall(`agent-rtc:meta:${data.to}`)
            : {};
          chatMessages.push({
            id,
            type: data.type || "message",
            sender: data.from || "",
            senderDisplayName: data.fromDisplayName || data.from || "",
            receiver: data.to || "",
            receiverDisplayName: receiverMeta.displayName || data.to || "",
            text: data.text || "",
            timestamp: data.timestamp || id.split("-")[0],
          });
        }
        return NextResponse.json(chatMessages);
      }

      case "agent-detail": {
        const agentId = req.nextUrl.searchParams.get("agentId");
        if (!agentId) {
          return NextResponse.json({ error: "agentId required" }, { status: 400 });
        }
        const meta = await redis.hgetall(`agent-rtc:meta:${agentId}`);
        const online = (await redis.exists(`agent-rtc:presence:${agentId}`)) === 1;
        const streamLen = await redis.xlen(`agent-rtc:agent:${agentId}`);
        const isMaster = (await redis.sismember("agent-rtc:masters", agentId)) === 1;
        const ttl = online ? await redis.ttl(`agent-rtc:presence:${agentId}`) : -1;
        let detailTags: string[] = [];
        try {
          detailTags = meta.tags ? JSON.parse(meta.tags) : [];
        } catch {
          detailTags = [];
        }
        return NextResponse.json({
          agentId,
          displayName: meta.displayName || agentId,
          online,
          isMaster,
          messageCount: streamLen,
          presenceTtl: ttl,
          description: meta.description || "",
          tags: detailTags,
        });
      }

      case "stats": {
        const [agentCount, masterCount, messageCount] = await Promise.all([
          redis.scard("agent-rtc:agents"),
          redis.scard("agent-rtc:masters"),
          redis.xlen("agent-rtc:messages"),
        ]);
        return NextResponse.json({ agentCount, masterCount, messageCount });
      }

      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redis error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    redis.disconnect();
  }
}
