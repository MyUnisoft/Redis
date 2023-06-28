// Import Node.js Dependencies
import { once } from "events";
import { performance } from "perf_hooks";

// Import Third-party Dependencies
import Redis, { RedisOptions } from "ioredis";
export { Redis } from "ioredis";

let publisher: Redis;
let subscriber: Redis;

export function getPublisher() {
  return publisher;
}

export function getSubscriber() {
  return subscriber;
}

/**
 *
 * Ensure the connection to the Redis instance.
 * @param {Redis} instance
 * @param {number} [attempt=4]
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
* Init a redis connection.
* @param {object} redisOptions - represent object who contains all connections options
*
*/
export async function initRedis(
  redisOptions: Partial<RedisOptions> & { port?: number; host?: string; } = {},
  initSubscriber?: boolean
): Promise<Redis> {
  const { port, host, password } = redisOptions;

  const redis = typeof port !== "undefined" && typeof host !== "undefined" ?
    new Redis(port, host, { password }) :
    new Redis({ password });

  await assertConnection(redis);

  if (initSubscriber) {
    subscriber = redis;
  }
  else {
    publisher = redis;
  }

  return redis;
}

/**
 * Check Redis connection state.
 */
export async function getConnectionPerf(extInstance?: Redis): Promise<GetConnectionPerfResponse> {
  const redis = extInstance ?? publisher;

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
  * Close a single local connection.
  */
export async function closeRedis(isSubscriber: boolean = false): Promise<void> {
  const redis = isSubscriber ? subscriber : publisher;

  const { isAlive } = await getConnectionPerf(redis);

  if (!isAlive) {
    return;
  }

  setImmediate(() => {
    redis.quit();
  });

  await once(redis, "end");
}

/**
 * Close every redis connections.
 */
export async function closeAllRedis(): Promise<void> {
  const instances = [publisher, subscriber];

  await Promise.all(instances.map(async(instance) => {
    const { isAlive } = await getConnectionPerf(instance);

    if (!isAlive) {
      return;
    }

    setImmediate(() => {
      instance.quit();
    });

    await once(instance, "end");
  }));
}

export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf?: number;
}

/**
  * Clear all keys from redis (it doesn't clean up streams or pubsub).
  */
export async function clearAllKeys(isSubscriber: boolean = false): Promise<void> {
  const redis = isSubscriber ? subscriber : publisher;

  await redis.flushdb();
}

export * from "./class/stream/index";
export * from "./class/pubSub/Channel.class";
export * from "./class/KVPeer.class";
export * from "./class/TimedKVPeer.class";
export * from "./class/RestrictedKV.class";
export * as Types from "./types/index";
