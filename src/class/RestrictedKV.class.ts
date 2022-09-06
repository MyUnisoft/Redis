// Import Third-party requirement
import dayjs from "dayjs";
import { Redis } from "ioredis";

// Import Internal dependencies
import { KVPeer, KVOptions, KeyType } from "./KVPeer.class";
import { getConnectionPerf } from "..";

// CONSTANTS
const kNumberOfAllowedAttempt = 6;
const kBanTimeInSecond = 60 * 5;

/**
* @class RestrictedKV
* @classdesc Implementation to prevent brute force attacks.
*/
export class RestrictedKV extends KVPeer<Partial<Attempt>> {
  private autoClearInterval;

  static getDefaultAttempt() {
    return { failure: 0, lastTry: Date.now(), locked: false };
  }

  constructor(options?: RestrictedKVOptions, redis?: Redis) {
    super({
      prefix: options?.prefix ?? "limited-",
      type: "object"
    }, redis);

    if (options?.autoClearExpired) {
      this.autoClearInterval = setInterval(async() => {
        try {
          const connectionPerf = await getConnectionPerf(this.redis);

          if (connectionPerf.isAlive) {
            await this.clearExpired();
          }
        }
        catch (error) {
          console.error(error);
        }
      }, options.autoClearExpired).unref();
    }
  }

  private parseRawAttempt(data: RawAttempt): Attempt {
    return {
      failure: Number(data?.failure ?? 0),
      lastTry: Number(data?.lastTry ?? Date.now()),
      locked: (data?.locked ?? "false") === "true"
    };
  }

  clearAutoClearInterval() {
    clearInterval(this.autoClearInterval);
    this.autoClearInterval = null;
  }

  /**
   * @description Returns the number of attempts (failure, last tentative timestamp ...) for a given key
   *
   * @param key - key WITHOUT PREFIX
   *
   * @example handler.getAttempt("myKey")
   */
  async getAttempt(key: KeyType): Promise<Attempt> {
    const data = await this.getValue(key) as RawAttempt | null;

    return Object.assign({}, RestrictedKV.getDefaultAttempt(), data === null ? {} : this.parseRawAttempt(data));
  }

  /**
  * @description Increment an access failure for a given key.
  * The method also allows to define whether a key is locked or not (when the number of failures exceeds the defined limitation).
  *
  * @param key - key WITHOUT PREFIX
  *
  * @example handler.fail("myKey")
  */
  async fail(key: KeyType): Promise<Attempt> {
    const stored = await this.getAttempt(key);
    const attempt: Attempt = { failure: 1, lastTry: Date.now(), locked: false };

    if (stored !== null) {
      const diff = dayjs().diff(stored.lastTry, "second");
      if (diff < kBanTimeInSecond) {
        attempt.failure = stored.failure + 1;
      }
      if (attempt.failure > kNumberOfAllowedAttempt) {
        attempt.locked = true;
      }
    }

    await this.setValue(attempt, key);

    return attempt;
  }

  /**
  * @description Notify a successful access for a given key. This will remove all traces of previous failed access.
  *
  * @param key - WITHOUT PREFIX
  *
  * @example handler.success("email@domain.com")
  */
  async success(key: KeyType) {
    const rawStored = await this.getValue(key);
    if (rawStored !== null) {
      await this.deleteValue(key);
    }
  }

  /**
  * @description Searches for all keys where the last attempt exceeds an allocated lifetime and clear (delete) them.
  *
  * @example handler.clearExpired()
  */
  async clearExpired() {
    const promises = [this.redis.keysBuffer(`${this.prefix}*`), this.redis.keys(`${this.prefix}*`)];

    const data = [...await Promise.all(promises)].flat();
    if (data.length === 0) {
      return;
    }

    const results = await Promise.all(data.map(async(key) => {
      const expired = await this.isKeyExpired(key);

      return { key, expired };
    }));
    const expiredKeys = results
      .filter((row) => row.expired)
      .map((row) => row.key);

    if (expiredKeys.length > 0) {
      const pipeline = this.redis.pipeline();
      this.emit("expiredKeys", expiredKeys);
      expiredKeys.forEach((key) => pipeline.del(key));

      await pipeline.exec();
    }
  }

  private async isKeyExpired(key: KeyType): Promise<boolean> {
    let finalKey: string | Buffer;

    if (typeof key === "object") {
      finalKey = Buffer.from(key.toString().slice(this.prefix.length));
    }
    else {
      finalKey = key.slice(this.prefix.length);
    }

    const attempt = await this.getValue(finalKey) as Attempt;
    const lastTry = "lastTry" in attempt ? Number(attempt.lastTry) : null;

    return lastTry === null ? false : dayjs().diff(lastTry, "second") >= kBanTimeInSecond;
  }
}

export type RestrictedKVOptions = Pick<KVOptions<Attempt>, "prefix"> & {
  autoClearExpired?: number;
}

// type Definition
export interface Attempt {
  failure: number;
  lastTry: number;
  locked: boolean;
}

export type RawAttempt = Record<keyof Attempt, string>;

