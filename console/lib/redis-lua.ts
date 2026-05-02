import { createHash } from "node:crypto";
import type Redis from "ioredis";

const DUAL_XADD_SCRIPT = `
redis.call('XADD', KEYS[1], 'MAXLEN', '~', ARGV[1], '*', 'data', ARGV[2])
redis.call('XADD', KEYS[2], 'MAXLEN', '~', ARGV[1], '*', 'data', ARGV[2])
return 1
`;

const DUAL_XADD_SHA = createHash("sha1").update(DUAL_XADD_SCRIPT).digest("hex");

/**
 * Atomically write a message to two Redis streams.
 * Falls back to individual XADD calls if the Lua script is evicted.
 */
export async function dualXadd(
  redis: Redis,
  stream1: string,
  stream2: string,
  maxlen: string,
  data: string
): Promise<void> {
  try {
    await redis.evalsha(DUAL_XADD_SHA, 2, stream1, stream2, maxlen, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("NOSCRIPT")) {
      try {
        await redis.eval(DUAL_XADD_SCRIPT, 2, stream1, stream2, maxlen, data);
      } catch {
        await redis.xadd(stream1, "MAXLEN", "~", maxlen, "*", "data", data);
        await redis.xadd(stream2, "MAXLEN", "~", maxlen, "*", "data", data);
      }
    } else {
      await redis.xadd(stream1, "MAXLEN", "~", maxlen, "*", "data", data);
      await redis.xadd(stream2, "MAXLEN", "~", maxlen, "*", "data", data);
    }
  }
}
