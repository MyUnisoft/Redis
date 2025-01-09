
// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Third-party Dependencies
import { Result } from "@openally/result";

// Import Internal Dependencies
import type { KeyType, DatabaseConnection } from "../types/index.js";
import type { KVType, RedisSetValueOptions, StringOrObject } from "./adapter/redis.adapter.js";

// CONSTANTS
const kDefaultKVType = "raw";

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> =
  K extends Record<string, any> ? T & { customData: K; } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
  IsMetadataDefined<T, K> : T;

export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
  adapter: DatabaseConnection;
  type?: KVType;
  mapValue?: KVMapper<T, K>;
  prefix?: string;
  prefixSeparator?: string;
}

export type KVPeerSetValueOptions<T extends StringOrObject = StringOrObject> = Omit<
  RedisSetValueOptions<T>,
  "type"
>;

/**
* @class KVPeer
* @extends EventEmitter
* @description This class is used to store and retrieve key-value peers in Redis.
*
* @property {Redis} redis - Instance of Redis connection
*
* @example
* ```ts
* new KVPeer();
* ```
*/
export class KVPeer<T extends StringOrObject = StringOrObject, K extends Record<string, any> | null = null> extends EventEmitter {
  protected type: KVType;
  protected mapValue: KVMapper<T, K>;
  protected adapter: DatabaseConnection;
  protected prefix: string;
  protected prefixSeparator: string;

  constructor(options: KVOptions<T, K>) {
    super();

    const { type, mapValue, adapter, prefix = "", prefixSeparator = "-" } = options;

    this.adapter = adapter;
    this.prefix = prefix;
    this.prefixSeparator = prefix.length ? prefixSeparator : "";

    this.type = type ?? kDefaultKVType;
    this.mapValue = mapValue ?? this.defaultMapValue;
  }

  async setValue(options: KVPeerSetValueOptions<T>): Promise<Result<KeyType, Error>> {
    const { key, value, ...rest } = options;

    return this.adapter.setValue({
      key: this.keyWithPrefix(key),
      value,
      type: this.type,
      ...rest
    });
  }

  async getValue(key: KeyType): Promise<MappedValue<T, K> | null> {
    const result = await this.adapter.getValue(this.keyWithPrefix(key), this.type);

    return result === null ? null : this.mapValue(result as T);
  }

  async deleteValue(key: KeyType): Promise<number> {
    return this.adapter.deleteValue(this.keyWithPrefix(key));
  }

  private defaultMapValue(value: T): MappedValue<T, K> {
    return value as MappedValue<T, K>;
  }

  protected keyWithPrefix(key: KeyType) {
    return `${this.prefix}${this.prefixSeparator}${key}`;
  }
}

