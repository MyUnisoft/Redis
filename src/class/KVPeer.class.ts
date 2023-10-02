// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Internal Dependencies
import { getRedis } from "..";
import { KeyType } from "../types/index";

// CONSTANTS
const kDefaultKVType = "raw";

type ValueType = string | Buffer | number | any[];

export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> = K extends Record<string, any> ? T & { customData: K } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
IsMetadataDefined<T, K> : T;

export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
  prefix?: string;
  type?: KVType;
  mapValue?: KVMapper<T, K>;
}

export interface SetValueOptions<T> {
  key: KeyType;
  value: Partial<T>;
  expiresIn?: number;
}

/**
* @class KVPeer
* @extends EventEmitter
* @description This class is used to store and retrieve key-value peers in Redis.
*
* @property {Redis} redis - Instance of Redis connection
* @property {string} [prefix = ""] - prefix for keys
*
* @example
* ```ts
* new KVPeer();
* new KVPeer({ prefix: "myPrefix" });
* ```
*/
export class KVPeer<T extends StringOrObject = StringOrObject, K extends Record<string, any> | null = null> extends EventEmitter {
  protected prefix: string;
  protected prefixedName: string;
  protected type: KVType;
  protected mapValue: KVMapper<T , K>;

  constructor(options: KVOptions<T, K> = {}) {
    super();

    const { prefix, type, mapValue } = options;

    this.prefix = prefix ? `${prefix}-` : "";
    this.type = type ?? kDefaultKVType;
    this.mapValue = mapValue ?? this.defaultMapValue;
  }

  private defaultMapValue(value: T): MappedValue<T, K> {
    return value as MappedValue<T, K>;
  }

  get redis() {
    const redis = getRedis();

    if (!redis) {
      throw new Error("Redis must be init");
    }

    return redis;
  }

  async setValue(options: SetValueOptions<T>): Promise<KeyType> {
    const { key, value, expiresIn } = options;

    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
    const multiRedis = this.redis.multi();

    if (this.type === "raw") {
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      multiRedis.set(finalKey, payload);
    }
    else {
      const propsMap = new Map(Object.entries(value as Record<string, any>).map(
        ([key, value]) => typeof value === "object" ? [key, JSON.stringify(value)] : [key, value]
      )) as Map<string, ValueType>;

      multiRedis.hmset(finalKey, propsMap);
    }

    if (expiresIn) {
      multiRedis.pexpire(finalKey, expiresIn);
    }

    await multiRedis.exec();

    return finalKey;
  }

  async getValue(key: KeyType): Promise<MappedValue<T, K> | null> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    const result = this.type === "raw" ?
      await this.redis.get(finalKey) :
      deepParse(await this.redis.hgetall(finalKey));

    if (this.type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result === null ? null : this.mapValue(result as T);
  }

  async deleteValue(key: KeyType): Promise<number> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    return this.redis.del(finalKey);
  }
}


function deepParse(object: Record<string, any>): Record<string, any> {
  function* parse() {
    for (const [key, value] of Object.entries(object)) {
      if (typeof value !== "object" || !isNaN(Number(value))) {
        try {
          yield [key, JSON.parse(value)];
        }
        catch {
          yield [key, value];
        }
      }
      else {
        yield [key, value];
      }
    }
  }

  return Object.fromEntries(parse());
}
