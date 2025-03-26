// Import Node.js Dependencies
import { once } from "node:events";

// Import Third-party Dependencies
import { Redis, RedisOptions } from "ioredis";
import { Err, Ok, Result } from "@openally/result";

// Import Internal Dependencies
import { AssertConnectionError, AssertDisconnectionError } from "../error/connection.error.js";
import { parseInput, parseOutput } from "../../utils/stream/index.js";
import type { DatabaseConnection, KeyType, Value } from "../../types/index.js";

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
  banTimeInSecond: number;
}

export type RedisIsKeyExpiredOptions = ClearExpiredOptions & {
  key: KeyType;
};

export interface RedisSetValueOptions<T extends StringOrObject = Record<string, any>> {
  key: KeyType;
  value: Partial<T>;
  type: KVType;
  expiresIn?: number;
}

export type RedisAdapterOptions = Partial<RedisOptions> & {
  attempt?: number;
  disconnectionTimeout?: number;
};

export class RedisAdapter<T extends StringOrObject = StringOrObject> extends Redis implements DatabaseConnection {
  #attempt: number;
  #disconnectionTimeout: number;

  constructor(options: RedisAdapterOptions = {}) {
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

  async setValue(
    options: RedisSetValueOptions<T>
  ): Promise<Result<KeyType, Error>> {
    const { key, value, expiresIn, type } = options;

    const finalKey = typeof key === "object" ? Buffer.from(key) : key;
    const multiRedis = this.multi();

    function booleanStringToBuffer(value: string): string | Buffer {
      return value === "false" || value === "true" ? Buffer.from(value) : value;
    }

    if (type === "raw") {
      const payload = typeof value === "object" ? JSON.stringify(value) : booleanStringToBuffer(value);
      multiRedis.set(finalKey, payload);
    }
    else {
      const propsMap = new Map(Object.entries(parseInput(value)).map(([key, value]) => {
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

    return Ok(finalKey);
  }

  async getValue(key: KeyType, type: KVType): Promise<T | null> {
    const finalKey = typeof key === "object" ? Buffer.from(key) : key;
    const result = type === "raw" ?
      await this.get(finalKey) :
      parseOutput(await this.hgetall(finalKey));

    if (type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result;
  }

  async deleteValue(key: KeyType): Promise<number> {
    const finalKey = typeof key === "object" ? Buffer.from(key) : key;

    return this.del(finalKey);
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
