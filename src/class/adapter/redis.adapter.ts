// Import Internal Dependencies
import { KeyType } from "../../types";
import { DatabaseConnection } from "../Connection.class";

// Import Third-party Dependencies
import { Redis, RedisOptions } from "ioredis";

export interface RedisDatabaseConnection extends DatabaseConnection {
  getValue(key: KeyType, prefix: string, type: KVType): Promise<any>;
}

export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

export class RedisAdapter implements RedisDatabaseConnection {
  private redisClient: Redis;

  constructor(redisOptions: RedisOptions) {
    this.redisClient = new Redis(redisOptions);
  }

  async connect(): Promise<void> {
    await this.redisClient.connect();
  }

  async close(forceExit = false): Promise<void> {
    if (forceExit) {
      return this.redisClient.disconnect();
    }

    await this.redisClient.quit();

    return void 0;
  }

  async isAlive(): Promise<boolean> {
    try {
      await this.redisClient.ping();

      return true;
    }
    catch {
      return false;
    }
  }

  async getPerformance(): Promise<number> {
    const start = performance.now();
    await this.redisClient.ping();

    return performance.now() - start;
  }

  async getValue(key: KeyType, prefix: string, type: KVType): Promise<any> {
    const finalKey = typeof key === "object" ? Buffer.from(prefix + key) : prefix + key;
    const result = type === "raw" ?
      await this.redisClient.get(finalKey) :
      this.parseOutput(await this.redisClient.hgetall(finalKey));

    if (type === "object" && result && Object.keys(result).length === 0) {
      return null;
    }

    return result;
  }

  async setValue() {
    return;
  }

  async deleteValue() {
    return;
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
}
