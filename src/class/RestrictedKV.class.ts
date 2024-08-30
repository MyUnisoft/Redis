// Import Internal dependencies
import { KVPeer, type KVOptions } from "./KVPeer.class.js";
import type { KeyType } from "../types/index.js";

// CONSTANTS
const kDefaultAllowedAttempt = 6;
const kDefaultBanTime = 60 * 5;

export type RestrictedKVOptions = Pick<KVOptions<Attempt>, "prefix" | "connection"> & {
  autoClearExpired?: number;
  allowedAttempt?: number;
  banTimeInSecond?: number;
};

// type Definition
export interface Attempt {
  failure: number;
  lastTry: number;
  locked: boolean;
}

export type RawAttempt = Record<keyof Attempt, string>;

/**
* @class RestrictedKV
* @classdesc Implementation to prevent brute force attacks.
*/
export class RestrictedKV extends KVPeer<Partial<Attempt>> {
  private autoClearInterval: NodeJS.Timeout | null;

  protected allowedAttempt: number;
  protected banTimeInSecond: number;

  static getDefaultAttempt() {
    return { failure: 0, lastTry: Date.now(), locked: false };
  }

  constructor(options: RestrictedKVOptions) {
    const { prefix, autoClearExpired, allowedAttempt, banTimeInSecond, connection } = options;

    super({
      connection,
      prefix: prefix ?? "limited-",
      type: "object"
    });

    this.allowedAttempt = allowedAttempt ?? kDefaultAllowedAttempt;
    this.banTimeInSecond = banTimeInSecond ?? kDefaultBanTime;

    if (autoClearExpired) {
      this.autoClearInterval = setInterval(async() => {
        try {
          const connectionPerf = await this.connection.getConnectionPerf();

          if (connectionPerf.isAlive) {
            await this.clearExpired();
          }
        }
        catch (error) {
          console.error(error);
        }
      }, autoClearExpired).unref();
    }
  }

  private parseRawAttempt(data: RawAttempt): Attempt {
    return {
      failure: Number(data.failure ?? 0),
      lastTry: Number(data.lastTry ?? Date.now()),
      locked: (data.locked ?? "false") === "true"
    };
  }

  clearAutoClearInterval() {
    if (this.autoClearInterval) {
      clearInterval(this.autoClearInterval);
    }
    this.autoClearInterval = null;
  }

  /**
   * @description Returns the number of attempts (failure, last tentative timestamp ...) for a given key
   *
   * @param key - key WITHOUT PREFIX
   *
   * @example
   * ```ts
   * handler.getAttempt("myKey")
   * ```
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
  * @example
  * ```ts
  * handler.fail("myKey")
  * ```
  */
  async fail(key: KeyType): Promise<Attempt> {
    const stored = await this.getAttempt(key);
    const attempt: Attempt = { failure: 1, lastTry: Date.now(), locked: false };

    if (stored !== null) {
      const diff = (Date.now() - stored.lastTry) / 1000;
      if (diff < this.banTimeInSecond) {
        attempt.failure = stored.failure + 1;
      }
      if (attempt.failure > this.allowedAttempt) {
        attempt.locked = true;
      }
    }

    await this.setValue({ key, value: attempt });

    return attempt;
  }

  /**
  * @description Notify a successful access for a given key. This will remove all traces of previous failed access.
  *
  * @param key - WITHOUT PREFIX
  *
  * @example
  * ```ts
  * handler.success("email@domain.com")
  * ```
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
  * @example
  * ```ts
  * handler.clearExpired()
  * ```
  */
  async clearExpired(): Promise<void> {
    const promises = [this.connection.keysBuffer(`${this.prefix}*`), this.connection.keys(`${this.prefix}*`)];

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
      const pipeline = this.connection.pipeline();
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

    return lastTry === null ? false : (Date.now() - lastTry) / 1000 >= this.banTimeInSecond;
  }
}
