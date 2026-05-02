import { createHash } from "node:crypto";

/**
 * Lua script for atomic dual-stream XADD.
 * Writes message to both a target stream and the global messages stream.
 * KEYS[1] = target stream, KEYS[2] = global messages stream
 * ARGV[1] = maxlen, ARGV[2] = data
 */
const DUAL_XADD_SCRIPT = `
redis.call('XADD', KEYS[1], 'MAXLEN', '~', ARGV[1], '*', 'data', ARGV[2])
redis.call('XADD', KEYS[2], 'MAXLEN', '~', ARGV[1], '*', 'data', ARGV[2])
return 1
`;

const DUAL_XADD_SHA = createHash("sha1").update(DUAL_XADD_SCRIPT).digest("hex");

/**
 * Atomically write a message to a target stream and the global messages stream.
 * Falls back to individual XADD calls if the script is evicted.
 */
export async function dualXadd(
  redis: { evalsha: Function; eval: Function; xadd: Function },
  targetStream: string,
  messagesStream: string,
  maxlen: string,
  data: string
): Promise<void> {
  try {
    await redis.evalsha(
      DUAL_XADD_SHA,
      2,
      targetStream,
      messagesStream,
      maxlen,
      data
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("NOSCRIPT")) {
      // Script evicted — reload and retry
      try {
        await redis.eval(
          DUAL_XADD_SCRIPT,
          2,
          targetStream,
          messagesStream,
          maxlen,
          data
        );
      } catch {
        // Lua failed entirely — fallback to individual calls
        await redis.xadd(targetStream, "MAXLEN", "~", maxlen, "*", "data", data);
        await redis.xadd(messagesStream, "MAXLEN", "~", maxlen, "*", "data", data);
      }
    } else {
      // Non-NOSCRIPT error — fallback
      await redis.xadd(targetStream, "MAXLEN", "~", maxlen, "*", "data", data);
      await redis.xadd(messagesStream, "MAXLEN", "~", maxlen, "*", "data", data);
    }
  }
}
