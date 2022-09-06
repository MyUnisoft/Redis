// Import Node.js Dependencies
import { randomBytes } from "crypto";
import { Redis } from "ioredis";

// Import Internal Dependencies
import { KVPeer, KVOptions, KeyType } from "../KVPeer.class";

// CONSTANTS
const kDefaultSessionDuration = 1_000 * 60 * 10;
// eslint-disable-next-line func-style
const kDefaultRandomKeyGenerator = () => randomBytes(6).toString("hex");

/**
* @class SessionStore
* @description Session Store represents a time-lifed store. You probably don't need to use this class directly.
*
* @property {TimeMap<Number>} store - represents the life-time of the store
*/
export class SessionStore<T extends object> extends KVPeer<T> {
  protected randomKeyGenerator: () => string;
  private ttl: number;

  constructor(options: Partial<SessionStoreOptions<T>> = {}, redis?: Redis) {
    super({ ...options, type: "object" }, redis);

    this.ttl = options.sessionDuration ?? kDefaultSessionDuration;
    this.randomKeyGenerator = options?.randomKeyCallback ?? kDefaultRandomKeyGenerator;
  }

  async setValue(value: T, key?: KeyType): Promise<KeyType> {
    const finalKey = key ?? this.randomKeyGenerator();

    await super.setValue(value, finalKey, this.ttl);

    return finalKey;
  }

  async deleteValue(key: string): Promise<number> {
    const result = await super.deleteValue(key);

    return result;
  }
}

// TYPES & INTERFACES
export interface SessionStoreOptions<T> extends Omit<KVOptions<T>, "type"> {
  /** How long the keys are kept, by default set to 10 minutes **/
  sessionDuration?: number;
  /** A random key callback generator for setValue() method **/
  randomKeyCallback?: () => string;
}
