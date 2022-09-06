// Import Node.js Dependencies
import { EventEmitter } from "events";

// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { getRedis } from "..";

// CONSTANTS
const kDefaultKVType = "raw";

type ValueType = string | Buffer | number | any[];

export type KeyType = string | Buffer;

export interface KVOptions<T> {
  prefix?: string;
  type?: KVType;
  mapValue?: KVMapper<T>;
}

export type KVMapper<T> = (value: any) => T;

export type KVType = "raw" | "object";

/**
* @class KVPeer
* @extends EventEmitter
* @description This class is used to store and retrieve key-value peers in Redis.
*
* @property {Redis.Redis} redis - Instance of Redis connection
* @property {string} [prefix = ""] - prefix for keys
*
* @example
* new KVPeer();
* new KVPeer({ prefix: "myPrefix" });
*/
export class KVPeer<T = string | Record<string, any>> extends EventEmitter {
  protected prefix: string;
  protected prefixedName: string;
  protected type: KVType;
  protected mapValue: KVMapper<T>;

  constructor(options: KVOptions<T> = {}, redis?: Redis) {
    super();

    const { prefix, type, mapValue } = options;

    if (redis) {
      this.redis = redis;
    }

    this.prefix = prefix ? `${prefix}-` : "";
    this.type = type ?? kDefaultKVType;
    this.mapValue = mapValue ?? ((value) => value);
  }

  set redis(extInstance: Redis) {
    this.redis = extInstance;
  }

  get redis() {
    return getRedis();
  }

  async setValue(value: T, key: KeyType, expiresIn?: number): Promise<KeyType> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
    const multiRedis = this.redis.multi();

    if (this.type === "raw") {
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      multiRedis.set(finalKey, payload);
    }
    else {
      const propsMap = new Map(Object.entries(value as Record<string, any>)) as Map<string, ValueType>;
      multiRedis.hmset(finalKey, propsMap);
    }

    if (expiresIn) {
      multiRedis.pexpire(finalKey, expiresIn);
    }

    await multiRedis.exec();

    return finalKey;
  }

  async getValue(key: KeyType): Promise<T | null> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    const result = this.type === "raw" ?
      await this.redis.get(finalKey) :
      await this.redis.hgetall(finalKey);

    if (this.type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result === null ? null : this.mapValue(result);
  }

  async deleteValue(key: KeyType): Promise<number> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    return this.redis.del(finalKey);
  }
}
