/**
 * Integration tests for agent-rtc message metadata round-trip.
 *
 * Spec: .sdd/specs/agent-rtc-metadata-v1.md (FR-012)
 *
 * These tests connect to a real Redis instance (REDIS_URL, defaulting to
 * redis://localhost:6379) and exercise the dual-stream write path + the
 * AgentStreamPayloadSchema used by redis-channel's listener loop.
 *
 * Run with:
 *   npm test
 *
 * Which compiles to `dist-test/` via tsconfig.test-build.json and then runs
 * `node --test dist-test/redis-channel.metadata.test.js`.
 *
 * The local docker-compose service `dispatch-test-redis-1` is sufficient.
 */
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { Redis } from "ioredis";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { dualXadd } from "./redis-lua.js";

// Mirror of the schemas in redis-channel.ts. Kept in sync by hand because
// redis-channel.ts is an executable module with side effects on import.
const AgentStreamPayloadSchema = z.object({
  type: z.string().optional(),
  from: z.string(),
  fromDisplayName: z.string(),
  text: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const TEST_ID = randomUUID().slice(0, 8);
const TARGET_STREAM = `agent-rtc-test:metadata:${TEST_ID}:target`;
const MESSAGES_STREAM = `agent-rtc-test:metadata:${TEST_ID}:messages`;

let redis: Redis;

before(async () => {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
  // Sanity check: the server is reachable
  await redis.ping();
});

after(async () => {
  if (redis) {
    await redis.del(TARGET_STREAM, MESSAGES_STREAM);
    redis.disconnect();
  }
});

/** Read every entry from the target stream and return their parsed `data` payloads. */
async function readAll(stream: string): Promise<string[]> {
  const entries = await redis.xrange(stream, "-", "+");
  const out: string[] = [];
  for (const [, fields] of entries) {
    const dataIdx = fields.indexOf("data");
    if (dataIdx === -1) continue;
    out.push(fields[dataIdx + 1]);
  }
  return out;
}

test("round-trips a message with metadata through both streams", async () => {
  const meta = { telegram_chat_id: "abc-123", origin: "telegram" };
  const payload = {
    type: "message",
    from: "agent-test-from",
    fromDisplayName: "Test Agent",
    to: "agent-test-to",
    text: "hello from test",
    timestamp: Date.now(),
    metadata: meta,
  };

  await dualXadd(redis, TARGET_STREAM, MESSAGES_STREAM, "1000", JSON.stringify(payload));

  for (const stream of [TARGET_STREAM, MESSAGES_STREAM]) {
    const raws = await readAll(stream);
    assert.equal(raws.length, 1, `expected one entry on ${stream}`);
    const parsed = AgentStreamPayloadSchema.safeParse(JSON.parse(raws[0]));
    assert.equal(parsed.success, true, `schema should accept payload with metadata on ${stream}`);
    if (parsed.success) {
      assert.deepEqual(parsed.data.metadata, meta);
      assert.equal(parsed.data.from, "agent-test-from");
      assert.equal(parsed.data.text, "hello from test");
    }
  }
});

test("round-trips a message WITHOUT metadata (backward compat)", async () => {
  // Use a separate pair of keys so we don't see the earlier test's entry
  const targetStream = `${TARGET_STREAM}:nometa`;
  const messagesStream = `${MESSAGES_STREAM}:nometa`;
  try {
    const payload = {
      type: "message",
      from: "agent-test-from",
      fromDisplayName: "Test Agent",
      to: "agent-test-to",
      text: "no metadata here",
      timestamp: Date.now(),
    };

    await dualXadd(redis, targetStream, messagesStream, "1000", JSON.stringify(payload));

    for (const stream of [targetStream, messagesStream]) {
      const raws = await readAll(stream);
      assert.equal(raws.length, 1, `expected one entry on ${stream}`);
      const parsed = AgentStreamPayloadSchema.safeParse(JSON.parse(raws[0]));
      assert.equal(parsed.success, true, `schema should accept payload without metadata on ${stream}`);
      if (parsed.success) {
        assert.equal(parsed.data.metadata, undefined);
        assert.equal(parsed.data.text, "no metadata here");
      }
    }
  } finally {
    await redis.del(targetStream, messagesStream);
  }
});

test("rejects metadata whose values are not strings", () => {
  // No Redis round-trip required for this case — it's a schema-only invariant.
  const badPayload = {
    type: "message",
    from: "agent-test-from",
    fromDisplayName: "Test Agent",
    text: "bad metadata",
    metadata: { telegram_chat_id: 123 }, // number instead of string
  };
  const parsed = AgentStreamPayloadSchema.safeParse(badPayload);
  assert.equal(parsed.success, false, "non-string metadata values must be rejected");
});
