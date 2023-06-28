import Redis, { RedisOptions } from "ioredis";
export { Redis } from "ioredis";
export declare function getPublisher(): Redis;
export declare function getSubscriber(): Redis;
/**
* Init a redis connection.
* @param {object} redisOptions - represent object who contains all connections options
*
*/
export declare function initRedis(redisOptions?: Partial<RedisOptions> & {
    port?: number;
    host?: string;
}, initSubscriber?: boolean): Promise<Redis>;
/**
 * Check Redis connection state.
 */
export declare function getConnectionPerf(extInstance?: Redis): Promise<GetConnectionPerfResponse>;
/**
  * Close a single local connection.
  */
export declare function closeRedis(isSubscriber?: boolean): Promise<void>;
/**
 * Close every redis connections.
 */
export declare function closeAllRedis(): Promise<void>;
export interface GetConnectionPerfResponse {
    isAlive: boolean;
    perf?: number;
}
/**
  * Clear all keys from redis (it doesn't clean up streams or pubsub).
  */
export declare function clearAllKeys(isSubscriber?: boolean): Promise<void>;
export * from "./class/stream/index";
export * from "./class/pubSub/Channel.class";
export * from "./class/KVPeer.class";
export * from "./class/TimedKVPeer.class";
export * from "./class/RestrictedKV.class";
export * as Types from "./types/index";
