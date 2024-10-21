// Import Node.js Dependencies
import { once } from "node:events";

// Import Third-party Dependencies
import { Redis, RedisOptions } from "ioredis";
import { Err, Ok, Result } from "@openally/result";

// Import Internal Dependencies
import { AssertConnectionError, AssertDisconnectionError } from "../error/connection.error.js";
import type { DatabaseConnection, KeyType, Value } from "../../types/index.js";
import { Attempt } from "../RestrictedKV.class.js";

// CONSTANTS
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;

export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf: number;
}

export interface ClearExpiredOptions {
  prefix: string;
  banTimeInSecond: number;
}

export type IsKeyExpiredOptions = ClearExpiredOptions & {
  key: KeyType;
};

export interface SetValueOptions<T extends StringOrObject = Record<string, any>> {
  key: KeyType;
  value: Partial<T>;
  prefix: string;
  type: KVType;
  expiresIn?: number;
}

export type RedisAdapterOptions = Partial<RedisOptions> & {
  attempt?: number;
  disconnectionTimeout?: number;
};

export class RedisAdapter extends Redis implements DatabaseConnection {
  #attempt: number;
  #disconnectionTimeout: number;

  constructor(options: RedisAdapterOptions) {
    super(options);

    this.#attempt = options.attempt ?? kDefaultAttempt;
    this.#disconnectionTimeout = options.disconnectTimeout ?? kDefaultTimeout;
  }

  async initialize() {
    await this.assertConnection();
  }

  async close(
    forceExit: boolean = false,
    attempt = this.#attempt
  ) {
    await this.assertDisconnection(forceExit, attempt);
  }

  async isAlive(): Promise<boolean> {
    try {
      await this.ping();

      return true;
    }
    catch {
      return false;
    }
  }

  async getPerformance(): Promise<GetConnectionPerfResponse> {
    const start = performance.now();

    try {
      await this.ping();
    }
    catch {
      return {
        isAlive: false,
        perf: performance.now() - start
      };
    }

    return {
      isAlive: true,
      perf: performance.now() - start
    };
  }

  async setValue<T extends StringOrObject = Record<string, any>>(options: SetValueOptions<T>): Promise<KeyType> {
    const { key, value, expiresIn, prefix, type } = options;

    const finalKey = typeof key === "object" ? Buffer.from(prefix + key) : prefix + key;
    const multiRedis = this.multi();

    function booleanStringToBuffer(value: string): string | Buffer {
      return value === "false" || value === "true" ? Buffer.from(value) : value;
    }

    if (type === "raw") {
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

  async getValue<T extends unknown>(key: KeyType, prefix: string, type: KVType): Promise<T | null> {
    const finalKey = typeof key === "object" ? Buffer.from(prefix + key) : prefix + key;
    const result = type === "raw" ?
      await this.get(finalKey) :
      this.parseOutput(await this.hgetall(finalKey));

    if (type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result;
  }

  async deleteValue(key: KeyType, prefix: string): Promise<number> {
    const finalKey = typeof key === "object" ? Buffer.from(prefix + key) : prefix + key;

    return this.del(finalKey);
  }

  async clearExpired(options: ClearExpiredOptions): Promise<(string | Buffer)[]> {
    const { prefix } = options;

    const promises = [this.keysBuffer(`${prefix}*`), this.keys(`${prefix}*`)];

    const data = [...await Promise.all(promises)].flat();
    if (data.length === 0) {
      return [];
    }

    const results = await Promise.all(data.map(async(key) => {
      const expired = await this.isKeyExpired({
        ...options,
        key
      });

      return { key, expired };
    }));

    const expiredKeys = results
      .filter((row) => row.expired)
      .map((row) => row.key);

    if (expiredKeys.length > 0) {
      const pipeline = this.pipeline();

      expiredKeys.forEach((key) => pipeline.del(key));

      await pipeline.exec();
    }

    return expiredKeys;
  }

  private async isKeyExpired(options: IsKeyExpiredOptions): Promise<boolean> {
    const { prefix, banTimeInSecond, key } = options;

    let finalKey: string | Buffer;

    if (typeof key === "object") {
      finalKey = Buffer.from(key.toString().slice(prefix.length));
    }
    else {
      finalKey = key.slice(prefix.length);
    }

    const attempt = await this.getValue<Attempt>(
      finalKey,
      prefix,
      "object"
    ) as Attempt;
    const lastTry = "lastTry" in attempt ? Number(attempt.lastTry) : null;

    return lastTry === null ? false : (Date.now() - lastTry) / 1000 >= banTimeInSecond;
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

    if (Array.isArray(object)) {
      return object.map((val) => this.parseOutput(val));
    }

    if (typeof object === "object" && object !== null) {
      return Object.keys(object).reduce(
        (obj, key) => Object.assign(obj, { [key]: this.parseOutput(object[key]) }),
        {}
      );
    }

    return object;
  }

  private async assertConnection(attempt = this.#attempt): Promise<Result<void, AssertConnectionError>> {
    if (attempt <= 0) {
      return Err(new AssertConnectionError());
    }

    const { isAlive } = await this.getPerformance();

    if (!isAlive) {
      return this.assertConnection(attempt - 1);
    }

    return Ok(void 0);
  }

  private async assertDisconnection(
    forceExit: boolean,
    attempt = this.#attempt
  ): Promise<Result<void, AssertDisconnectionError>> {
    if (attempt <= 0) {
      return Err(new AssertDisconnectionError());
    }

    if (forceExit) {
      this.disconnect();
    }
    else {
      this.quit();
    }

    try {
      await once(this, "end", {
        signal: AbortSignal.timeout(this.#disconnectionTimeout)
      });
    }
    catch {
      await this.assertDisconnection(forceExit, attempt - 1);
    }

    return Ok(void 0);
  }
}
