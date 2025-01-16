/* eslint-disable max-params */
// Import Node.js Dependencies
import { once } from "node:events";
import { performance } from "node:perf_hooks";

// Import Third-party Dependencies
import Redis, { RedisOptions } from "ioredis";
export { Redis } from "ioredis";

// CONSTANTS
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;
let publisher: Redis | undefined;
let subscriber: Redis | undefined;

export type Instance = "subscriber" | "publisher";

export function getRedis(instance: Instance = "publisher") {
  const redis = instance === "publisher" ? publisher : subscriber;

  return redis;
}

/**
 *
 * Ensure the connection to the Redis instance.
 * @param {Redis} instance
 * @param {number} [attempt=4]
 */
async function assertConnection(instance: Instance, attempt = kDefaultAttempt, redis?: Redis) {
  if (attempt <= 0) {
    throw new Error("Failed at initializing a Redis connection.");
  }

  const { isAlive } = await getConnectionPerf(instance, redis);

  if (!isAlive) {
    await assertConnection(instance, attempt - 1, redis);
  }
}

/**
* Init a redis connection.
* @param {object} redisOptions - represent object who contains all connections options
*
*/
export async function initRedis(
  redisOptions: Partial<RedisOptions> & { port?: number; host?: string; } = {},
  instance: Instance = "publisher",
  external?: boolean
): Promise<Redis> {
  const { port, host } = redisOptions;

  const redis = typeof port !== "undefined" && typeof host !== "undefined" ?
    new Redis(port, host, redisOptions) :
    new Redis(redisOptions);

  if (external) {
    await assertConnection(instance, kDefaultAttempt, redis);

    return redis;
  }
  else if (instance === "publisher" && !publisher) {
    publisher = redis;
  }
  else if (instance === "subscriber" && !subscriber) {
    subscriber = redis;
  }

  await assertConnection(instance);

  return redis;
}

/**
 * Check Redis connection state.
 */
export async function getConnectionPerf(
  instance: Instance = "publisher",
  redisInstance?: Redis
): Promise<GetConnectionPerfResponse> {
  const redis = typeof redisInstance === "undefined" ? getRedis(instance) : redisInstance;

  if (!redis) {
    return { isAlive: false };
  }

  const start = performance.now();

  try {
    await redis.ping();
  }
  catch {
    return { isAlive: false };
  }

  return { isAlive: true, perf: performance.now() - start };
}


interface AssertDisconnectionOptions {
  redis: Redis;
  attempt?: number;
  forceExit?: boolean;
  timeout?: number;
}

async function assertDisconnection(options: AssertDisconnectionOptions) {
  const { redis, instance, attempt, forceExit, timeout } = {
    ...options,
    instance: undefined,
    attempt: options.attempt ?? kDefaultAttempt,
    forceExit: options.forceExit ?? false,
    timeout: options.timeout ?? kDefaultTimeout
  };

  if (attempt <= 0) {
    throw new Error("Failed at closing a Redis connection.");
  }

  setImmediate(() => {
    if (!forceExit) {
      redis.quit();

      return;
    }

    redis.disconnect();
  });

  try {
    await once(redis, "end", { signal: AbortSignal.timeout(timeout) });
  }
  catch {
    await assertDisconnection({
      redis,
      attempt: attempt - 1,
      forceExit,
      timeout
    });
  }

  const { isAlive } = await getConnectionPerf(instance, redis);

  if (isAlive) {
    await assertDisconnection({
      redis,
      attempt: attempt - 1,
      forceExit,
      timeout
    });
  }
}

/**
  * Close a single local connection.
  */
export async function closeRedis(
  instance: Instance = "publisher",
  redisInstance?: Redis,
  forceExit: boolean = false,
  timeout?: number
): Promise<void> {
  const isExt = typeof redisInstance !== "undefined";
  const redis = isExt ? redisInstance : getRedis(instance);

  if (!redis) {
    throw new Error("Unavailable redis instance");
  }

  await closeConnection(instance, redis, forceExit, timeout);

  if (!isExt) {
    if (instance === "publisher") {
      publisher = undefined;
    }
    else {
      subscriber = undefined;
    }
  }
}

/**
 * Close every redis connections.
 */
export async function closeAllRedis(redisInstance?: Redis[], forceExit: boolean = false, timeout?: number): Promise<void> {
  const instances = [...(typeof redisInstance === "undefined" ? [] : redisInstance), getRedis(), getRedis("subscriber")];

  await Promise.all(instances.map(async(instance) => {
    if (!instance) {
      return;
    }

    await closeConnection("publisher", instance, forceExit, timeout);
  }));
}

export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf?: number;
}

/**
  * Clear all keys from redis (it doesn't clean up streams).
  */
export async function clearAllKeys(instance: Instance = "publisher", redis?: Redis): Promise<void> {
  const redisInstance = typeof redis === "undefined" ? getRedis(instance) : redis;

  if (!redisInstance) {
    throw new Error("No available local instance");
  }

  await redisInstance.flushdb();
}

async function closeConnection(
  instance: Instance = "publisher",
  redis: Redis,
  forceExit: boolean = false,
  timeout?: number
) {
  const { isAlive } = await getConnectionPerf(instance, redis);

  if (!isAlive) {
    return;
  }

  await assertDisconnection({
    redis,
    forceExit,
    timeout
  });
}

export * from "./class/stream/index";
export * from "./class/pubSub/Channel.class";
export * from "./class/KVPeer.class";
export * from "./class/TimedKVPeer.class";
export * from "./class/RestrictedKV.class";
export * from "./class/StoreContext.class";
export * as Types from "./types/index";
