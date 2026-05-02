import { createHash } from "node:crypto";

const DUAL_XADD_SCRIPT = `
redis.call('XADD', KEYS[1], 'MAXLEN', '~', ARGV[1], '*', 'data', ARGV[2])
redis.call('XADD', KEYS[2], 'MAXLEN', '~', ARGV[1], '*', 'data', ARGV[2])
return 1
`;

let cachedSha = createHash("sha1").update(DUAL_XADD_SCRIPT).digest("hex");

/** Type-safe interface for Redis Lua operations */
export interface RedisLuaClient {
  evalsha(sha: string, numkeys: number, ...args: string[]): Promise<unknown>;
  script(...args: unknown[]): Promise<unknown>;
}

async function reloadScript(redis: RedisLuaClient): Promise<void> {
  cachedSha = (await redis.script("load", DUAL_XADD_SCRIPT)) as string;
}

/**
 * Atomically write a message to two Redis streams using a Lua script.
 * On NOSCRIPT error, reloads the script via SCRIPT LOAD and retries.
 */
export async function dualXadd(
  redis: RedisLuaClient,
  stream1: string,
  stream2: string,
  maxlen: string,
  data: string
): Promise<void> {
  try {
    await redis.evalsha(cachedSha, 2, stream1, stream2, maxlen, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("NOSCRIPT")) {
      await reloadScript(redis);
      await redis.evalsha(cachedSha, 2, stream1, stream2, maxlen, data);
    } else {
      throw err;
    }
  }
}
