// Import Node.js Dependencies
import { once } from "events";
import { performance } from "perf_hooks";

// Import Third-party Dependencies
import Redis, { RedisOptions } from "ioredis";
export { Redis } from "ioredis";

let localRedis: Redis;

export function getRedis() {
  return localRedis;
}

/**
 *
 * Use to ensure the connection to the Redis instance.
 * @param {Redis} instance
 * @param {number} [attempt=4]
 * @returns
 */
async function assertConnection(instance: Redis, attempt = 4) {
  if (attempt <= 0) {
    throw new Error("Failed at initializing a Redis connection.");
  }

  const { isAlive } = await getConnectionPerf(instance);

  if (!isAlive) {
    await assertConnection(instance, attempt - 1);
  }
}

/**
* this function init the store & wait if process exit for closing the store
* @param {object} redisOptions - represent object who contains all connections options
*
*/
export async function initRedis(
  redisOptions: Partial<RedisOptions> & { port: number; host: string; },
  extInstance?: boolean
): Promise<Redis> {
  const { port, host, password } = redisOptions;

  const redis = new Redis(port, host, { password });

  await assertConnection(redis);

  if (!extInstance) {
    localRedis = redis;
  }

  return redis;
}

/**
  * this function is used to close the store
  * @returns void
  */
export async function closeRedis(extInstance?: Redis): Promise<void> {
  const redis = extInstance || localRedis;

  const { isAlive } = await getConnectionPerf(redis);

  if (!isAlive) {
    return;
  }

  setImmediate(() => {
    redis.quit();
  });

  await once(redis, "end");
}

export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf?: number;
}

export async function getConnectionPerf(extInstance?: Redis): Promise<GetConnectionPerfResponse> {
  const redis = extInstance || localRedis;

  const start = performance.now();

  try {
    await redis.ping();
  }
  catch {
    return { isAlive: false };
  }

  return { isAlive: true, perf: performance.now() - start };
}

/**
  * this function is used to clear all keys from redis
  */
export async function clearAllKeys(extInstance?: Redis): Promise<void> {
  const redis = extInstance || localRedis;

  await redis.flushdb();
}

export * from "./class/stream/index";
export * from "./class/pubSub/Channel.class";
export * from "./class/KVPeer.class";
export * from "./class/TimedKVPeer.class";
export * from "./class/RestrictedKV.class";
export * as Types from "./types/index";
