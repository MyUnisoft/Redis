// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Internal Dependencies
import { getRedis } from "..";
import { KeyType } from "../types/index";

// Import Third-Party Dependencies
import { Packr } from "msgpackr";

// CONSTANTS
const kDefaultKVType = "raw";
const kWrongRedisCommandError = "WRONGTYPE Operation against a key holding the wrong kind of value";
const packr = new Packr({
  maxSharedStructures: 8160,
  structures: []
});

type CustomPackFn<T extends StringOrObject = Record<string, any>> =
  (value: Partial<T>) => Buffer;

type CustomUnpackFn<T extends StringOrObject = Record<string, any>> =
  (messagePack: Buffer | Uint8Array) => T;

export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> =
  K extends Record<string, any> ? T & { customData: K } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
IsMetadataDefined<T, K> : T;

export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
  prefix?: string;
  type?: KVType;
  mapValue?: KVMapper<T, K>;
}

export interface SetValueOptions<T extends StringOrObject = Record<string, any>> {
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
  protected mapValue: KVMapper<T, K>;
  protected customPack = packr.pack.bind(packr) as CustomPackFn<T>;
  protected customUnpack = packr.unpack.bind(packr) as CustomUnpackFn<T>;

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
      const buffer = this.customPack(value);

      multiRedis.set(finalKey, buffer);
    }

    if (expiresIn) {
      multiRedis.pexpire(finalKey, expiresIn);
    }

    await multiRedis.exec();

    return finalKey;
  }

  async getValue(key: KeyType): Promise<MappedValue<T, K> | null> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    const result = (this.type === "raw" ?
      await this.redis.get(finalKey) :
      await this.handlePackedOrMappedObject(finalKey)) as T;

    if (this.type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result === null ? null : this.mapValue(result);
  }

  async deleteValue(key: KeyType): Promise<number> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    return this.redis.del(finalKey);
  }

  private deepParse(object: Record<string, any>): T {
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

  private async handlePackedOrMappedObject(key: KeyType): Promise<T | null> {
    let result: T | null = null;

    try {
      const packedValue = await this.redis.getBuffer(key);

      if (packedValue !== null) {
        result = this.customUnpack(packedValue);
      }
    }
    catch (error) {
      if (error.message !== kWrongRedisCommandError) {
        throw error;
      }

      result = this.deepParse(await this.redis.hgetall(key));
    }

    return result;
  }
}
