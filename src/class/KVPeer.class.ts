
// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Third-party Dependencies
import { Result } from "@openally/result";

// Import Internal Dependencies
import type { KeyType, DatabaseConnection } from "../types/index.js";
import type { KVType, RedisSetValueOptions, StringOrObject } from "./adapter/redis.adapter.js";

// CONSTANTS
const kDefaultKVType = "raw";

export interface KVOptions<
  T extends unknown = unknown
> {
  adapter: DatabaseConnection<T>;
  type?: KVType;
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
export class KVPeer<
  T extends StringOrObject = StringOrObject,
  K = unknown
> extends EventEmitter {
  protected type: KVType;
  protected adapter: DatabaseConnection<K>;
  protected prefix: string;
  protected prefixSeparator: string;

  constructor(options: KVOptions<K>) {
    super();

    const { type, adapter, prefix = "", prefixSeparator = "-" } = options;

    this.adapter = adapter;
    this.prefix = prefix;
    this.prefixSeparator = prefix.length ? prefixSeparator : "";

    this.type = type ?? kDefaultKVType;
  }

  async setValue<U extends StringOrObject = T>(options: KVPeerSetValueOptions<U>): Promise<Result<KeyType, Error>> {
    const { key, value, ...rest } = options;

    return this.adapter.setValue({
      key: this.keyWithPrefix(key),
      value,
      type: this.type,
      ...rest
    });
  }

  async getValue<U extends StringOrObject = T>(key: KeyType): Promise<U | null> {
    const result = await this.adapter.getValue<U>(this.keyWithPrefix(key), this.type);

    return result;
  }

  async deleteValue(key: KeyType): Promise<number> {
    return this.adapter.deleteValue(this.keyWithPrefix(key));
  }

  protected keyWithPrefix(key: KeyType) {
    return `${this.prefix}${this.prefixSeparator}${key}`;
  }
}
