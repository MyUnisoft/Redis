import Redis, { RedisOptions } from "ioredis";
export { Redis } from "ioredis";
export declare type Instance = "subscriber" | "publisher";
export declare function getRedis(instance?: Instance): Redis | undefined;
/**
* Init a redis connection.
* @param {object} redisOptions - represent object who contains all connections options
*
*/
export declare function initRedis(redisOptions?: Partial<RedisOptions> & {
    port?: number;
    host?: string;
}, instance?: Instance, external?: boolean): Promise<Redis>;
/**
 * Check Redis connection state.
 */
export declare function getConnectionPerf(instance?: Instance, redisInstance?: Redis): Promise<GetConnectionPerfResponse>;
/**
  * Close a single local connection.
  */
export declare function closeRedis(instance?: Instance, redisInstance?: Redis): Promise<void>;
/**
 * Close every redis connections.
 */
export declare function closeAllRedis(redisInstance?: [Redis, Redis]): Promise<void>;
export interface GetConnectionPerfResponse {
    isAlive: boolean;
    perf?: number;
}
/**
  * Clear all keys from redis (it doesn't clean up streams).
  */
export declare function clearAllKeys(instance?: Instance, redis?: Redis): Promise<void>;
export * from "./class/stream/index";
export * from "./class/pubSub/Channel.class";
export * from "./class/KVPeer.class";
export * from "./class/TimedKVPeer.class";
export * from "./class/RestrictedKV.class";
export * from "./class/StoreContext.class";
export * as Types from "./types/index";
