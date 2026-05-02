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

let cachedSha = createHash("sha1").update(DUAL_XADD_SCRIPT).digest("hex");

interface RedisLuaClient {
  evalsha(sha: string, numkeys: number, ...args: string[]): Promise<unknown>;
  script(cmd: "load", script: string): Promise<string>;
}

/**
 * Reload the Lua script into Redis and update the cached SHA.
 */
async function reloadScript(redis: RedisLuaClient): Promise<void> {
  cachedSha = await redis.script("load", DUAL_XADD_SCRIPT);
}

/**
 * Atomically write a message to two Redis streams using a Lua script.
 * On NOSCRIPT error, reloads the script via SCRIPT LOAD and retries.
 */
export async function dualXadd(
  redis: RedisLuaClient,
  targetStream: string,
  messagesStream: string,
  maxlen: string,
  data: string
): Promise<void> {
  try {
    await redis.evalsha(cachedSha, 2, targetStream, messagesStream, maxlen, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("NOSCRIPT")) {
      await reloadScript(redis);
      await redis.evalsha(cachedSha, 2, targetStream, messagesStream, maxlen, data);
    } else {
      throw err;
    }
  }
}
