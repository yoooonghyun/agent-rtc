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
        const chatLimit = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get("limit") ?? "50")));
        const chatBeforeParam = req.nextUrl.searchParams.get("before");
        // Make before exclusive by subtracting from sequence
        let chatBefore = "+";
        if (chatBeforeParam) {
          const parts = chatBeforeParam.split("-");
          const seq = Number(parts[1] ?? 0);
          chatBefore = seq > 0 ? `${parts[0]}-${seq - 1}` : `${Number(parts[0]) - 1}`;
        }
        const chatEntries = await redis.xrevrange("agent-rtc:messages", chatBefore, "-");
        const chatMessages = [];
        for (const [id, fields] of chatEntries) {
          if (chatMessages.length >= chatLimit) break;
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
        const hasMore = chatEntries.length > chatMessages.length || chatMessages.length === chatLimit;
        return NextResponse.json({ messages: chatMessages, hasMore });
      }

      case "direct-messages": {
        const agentId = req.nextUrl.searchParams.get("agentId");
        if (!agentId) {
          return NextResponse.json({ error: "agentId required" }, { status: 400 });
        }
        const directEntries = await redis.xrevrange("agent-rtc:messages", "+", "-", "COUNT", 200);
        const directMessages = [];
        for (const [id, fields] of directEntries) {
          const fieldMap: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            fieldMap[fields[i]] = fields[i + 1];
          }
          const data = fieldMap.data ? JSON.parse(fieldMap.data) : {};
          const isConsoleToAgent = data.from === "console" && data.to === agentId;
          const isAgentToConsole = data.from === agentId && data.to === "console";
          if (!isConsoleToAgent && !isAgentToConsole) continue;
          const receiverMeta = data.to
            ? await redis.hgetall(`agent-rtc:meta:${data.to}`)
            : {};
          directMessages.push({
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
        return NextResponse.json(directMessages);
      }

      case "agent-messages": {
        const agentId = req.nextUrl.searchParams.get("agentId");
        if (!agentId) {
          return NextResponse.json({ error: "agentId required" }, { status: 400 });
        }
        const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
        const pageSize = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("pageSize") ?? "20")));

        // Fetch all entries to filter by agent, then paginate
        const allEntries = await redis.xrevrange("agent-rtc:messages", "+", "-");
        const filtered: Array<{ id: string; fields: string[] }> = [];
        for (const [id, fields] of allEntries) {
          const fieldMap: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            fieldMap[fields[i]] = fields[i + 1];
          }
          const data = fieldMap.data ? JSON.parse(fieldMap.data) : {};
          if (data.from === agentId || data.to === agentId) {
            filtered.push({ id, fields });
          }
        }

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const slice = filtered.slice(start, start + pageSize);

        const agentMessages = await Promise.all(
          slice.map(async ({ id, fields }) => {
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

        return NextResponse.json({
          messages: agentMessages,
          total,
          page,
          pageSize,
        });
      }

      case "all-messages": {
        const allPage = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
        const allPageSize = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("pageSize") ?? "20")));
        const allMsgEntries = await redis.xrevrange("agent-rtc:messages", "+", "-");
        const allTotal = allMsgEntries.length;
        const allStart = (allPage - 1) * allPageSize;
        const allPaged = allMsgEntries.slice(allStart, allStart + allPageSize);
        const allMessages = await Promise.all(
          allPaged.map(async ([id, fields]) => {
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
        return NextResponse.json({ messages: allMessages, total: allTotal, page: allPage, pageSize: allPageSize });
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

      case "permissions": {
        const permEntries = await redis.xrevrange(
          "agent-rtc:permissions",
          "+",
          "-",
          "COUNT",
          50,
        );
        const permissions = permEntries.map(([id, fields]) => {
          const fieldMap: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            fieldMap[fields[i]] = fields[i + 1];
          }
          const data = fieldMap.data ? JSON.parse(fieldMap.data) : {};
          return {
            id,
            type: data.type || "permission_request",
            from: data.from || "",
            fromDisplayName: data.fromDisplayName || data.from || "",
            text: data.text || "",
            timestamp: data.timestamp || id.split("-")[0],
          };
        });
        return NextResponse.json(permissions);
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action;

  if (!action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const redis = getRedis();

  try {
    await redis.connect();

    switch (action) {
      case "permission-verdict": {
        const { agentId, requestId, allow } = body as {
          agentId?: string;
          requestId?: string;
          allow?: boolean;
        };

        if (!agentId || !requestId) {
          return NextResponse.json(
            { error: "agentId and requestId required" },
            { status: 400 },
          );
        }

        const verdict = allow ? `yes ${requestId}` : `no ${requestId}`;
        const verdictData = JSON.stringify({
          type: "permission_response",
          from: "console",
          fromDisplayName: "Console",
          to: agentId,
          text: verdict,
          timestamp: Date.now().toString(),
        });

        await redis.xadd(`agent-rtc:agent:${agentId}`, "*", "data", verdictData);

        return NextResponse.json({ ok: true });
      }

      case "update-meta": {
        const { agentId, displayName, description, tags } = body as {
          agentId?: string;
          displayName?: string;
          description?: string;
          tags?: string[];
        };

        if (!agentId) {
          return NextResponse.json({ error: "agentId required" }, { status: 400 });
        }

        const updates: Record<string, string> = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (description !== undefined) updates.description = description;
        if (tags !== undefined) updates.tags = JSON.stringify(tags);

        if (Object.keys(updates).length > 0) {
          await redis.hset(`agent-rtc:meta:${agentId}`, updates);
        }

        return NextResponse.json({ ok: true });
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
