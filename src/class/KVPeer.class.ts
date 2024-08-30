
// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Internal Dependencies
import type { KeyType, Value } from "../types/index";
import { Connection } from "./Connection.class.js";

// CONSTANTS
const kDefaultKVType = "raw";

export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> =
  K extends Record<string, any> ? T & { customData: K; } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
  IsMetadataDefined<T, K> : T;

export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
  connection: Connection;
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
  protected connection: Connection;

  constructor(options: KVOptions<T, K>) {
    super();

    const { prefix, type, mapValue, connection } = options;

    this.connection = connection;

    if (!this.connection.ready) {
      throw new Error("Redis connection not initialized");
    }

    this.prefix = prefix ? `${prefix}-` : "";
    this.type = type ?? kDefaultKVType;
    this.mapValue = mapValue ?? this.defaultMapValue;
  }

  private defaultMapValue(value: T): MappedValue<T, K> {
    return value as MappedValue<T, K>;
  }

  async setValue(options: SetValueOptions<T>): Promise<KeyType> {
    const { key, value, expiresIn } = options;

    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
    const multiRedis = this.connection.multi();

    function booleanStringToBuffer(value: string): string | Buffer {
      return value === "false" || value === "true" ? Buffer.from(value) : value;
    }

    if (this.type === "raw") {
      const payload = typeof value === "object" ? JSON.stringify(value) : booleanStringToBuffer(value);
      multiRedis.set(finalKey, payload);
    }
    else {
      const propsMap = new Map(Object.entries(this.parseInput(value)).map(([key, value]) => {
        if (typeof value === "object") {
          return [key, JSON.stringify(value)];
        }

        return [key, booleanStringToBuffer(value)];
      })) as Map<string, Value>;

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
      await this.connection.get(finalKey) :
      this.parseOutput(await this.connection.hgetall(finalKey));

    if (this.type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result === null ? null : this.mapValue(result as T);
  }

  async deleteValue(key: KeyType): Promise<number> {
    const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;

    return this.connection.del(finalKey);
  }

  private* deepParseInput(input: Record<string, any> | any[]) {
    if (Array.isArray(input)) {
      for (const value of input) {
        if (typeof value === "object" && value !== null) {
          if (Buffer.isBuffer(value)) {
            yield value.toString();
          }
          else if (Array.isArray(value)) {
            yield [...this.deepParseInput(value)];
          }
          else {
            yield Object.fromEntries(this.deepParseInput(value));
          }
        }
        else {
          yield value;
        }
      }
    }
    else {
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === "object" && value !== null) {
          if (Buffer.isBuffer(value)) {
            yield [key, value.toString()];
          }
          else if (Array.isArray(value)) {
            yield [key, [...this.deepParseInput(value)]];
          }
          else {
            yield [key, JSON.stringify(Object.fromEntries(this.deepParseInput(value)))];
          }
        }
        else {
          yield [key, value];
        }
      }
    }
  }

  private parseInput(object: Record<string, any>) {
    return Object.fromEntries(this.deepParseInput(object));
  }

  private parseOutput(object: Record<string, any>) {
    if (typeof object === "string") {
      if (!Number.isNaN(Number(object))) {
        // if a numeric string is received, return itself
        // otherwise JSON.parse will convert it to a number
        return object;
      }
      else if (object === "false" || object === "true") {
        return object;
      }

      try {
        return this.parseOutput(JSON.parse(object));
      }
      catch {
        return object;
      }
    }

    // if an array is received, map over the array and deepParse each value
    if (Array.isArray(object)) {
      return object.map((val) => this.parseOutput(val));
    }

    // if an object is received then deep parse each element in the object
    // typeof null returns 'object' too, so we have to eliminate that
    if (typeof object === "object" && object !== null) {
      return Object.keys(object).reduce(
        (obj, key) => Object.assign(obj, { [key]: this.parseOutput(object[key]) }),
        {}
      );
    }

    return object;
  }
}

