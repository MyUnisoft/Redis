import Redis, { RedisOptions } from "ioredis";
export { Redis } from "ioredis";
export declare function getRedis(): Redis;
/**
* this function init the store & wait if process exit for closing the store
* @param {object} redisOptions - represent object who contains all connections options
*
*/
export declare function initRedis(redisOptions: Partial<RedisOptions> & {
    port: number;
    host: string;
}, extInstance?: boolean): Promise<Redis>;
/**
  * this function is used to close the store
  * @returns void
  */
export declare function closeRedis(extInstance?: Redis): Promise<void>;
export interface GetConnectionPerfResponse {
    isAlive: boolean;
    perf?: number;
}
export declare function getConnectionPerf(extInstance?: Redis): Promise<GetConnectionPerfResponse>;
/**
  * this function is used to clear all keys from redis
  */
export declare function clearAllKeys(extInstance?: Redis): Promise<void>;
export * from "./class/stream/index";
export * from "./class/pubSub/Channel.class";
export * from "./class/KVPeer.class";
export * from "./class/TimedKVPeer.class";
export * from "./class/RestrictedKV.class";
export * as Types from "./types/index";
