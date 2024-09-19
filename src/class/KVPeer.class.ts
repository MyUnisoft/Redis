
// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Internal Dependencies
import type { KeyType, DatabaseConnection } from "../types/index.js";

// CONSTANTS
const kDefaultKVType = "raw";

export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> =
  K extends Record<string, any> ? T & { customData: K; } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
  IsMetadataDefined<T, K> : T;

export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export interface SetValueOptions<T extends StringOrObject = Record<string, any>> {
  key: KeyType;
  value: Partial<T>;
  prefix: string;
  type: KVType;
  expiresIn?: number;
}

export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
  adapter: DatabaseConnection;
  prefix?: string;
  type?: KVType;
  mapValue?: KVMapper<T, K>;
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
  protected adapter: DatabaseConnection;

  constructor(options: KVOptions<T, K>) {
    super();

    const { prefix, type, mapValue, adapter } = options;

    this.adapter = adapter;

    this.prefix = prefix ? `${prefix}-` : "";
    this.type = type ?? kDefaultKVType;
    this.mapValue = mapValue ?? this.defaultMapValue;
  }

  private defaultMapValue(value: T): MappedValue<T, K> {
    return value as MappedValue<T, K>;
  }

  async getValue(key: KeyType): Promise<MappedValue<T, K> | null> {
    const result = await this.adapter.getValue(key, this.prefix, this.type);

    return result === null ? null : this.mapValue(result as T);
  }
}

