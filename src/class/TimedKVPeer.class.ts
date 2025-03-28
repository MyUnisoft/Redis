// Import Node.js Dependencies
import { randomBytes } from "node:crypto";

// Import Third-party Dependencies
import { Result, Ok } from "@openally/result";

// Import Internal Dependencies
import { KVPeer, type KVOptions } from "./KVPeer.class.js";
import type { KeyType } from "../types/index.js";
import type { RedisSetValueOptions } from "./adapter/redis.adapter.js";

// CONSTANTS
const kDefaultTtl = 1_000 * 60 * 10;
// eslint-disable-next-line func-style
const kDefaultRandomKeyGenerator = () => randomBytes(6).toString("hex");

export interface TimedKVPeerOptions
  extends Omit<KVOptions, "type"> {
  /** How long the keys are kept, by default set to 10 minutes **/
  ttl?: number;
  /** A random key callback generator for setValue() method **/
  randomKeyCallback?: () => string;
}

interface TimedSetValueOptions<T extends object> extends Omit<
  RedisSetValueOptions<T>,
  "expiresIn" | "key" | "type"
> {
  key?: string | Buffer;
}

/**
* @class TimedKVPeer
* @description TimedKVPeer represents an abstraction design to store time-lifed key-value peer. You probably don't need to use this class directly.
*/
export class TimedKVPeer<
  T extends object
> extends KVPeer<T> {
  protected randomKeyGenerator: () => string;
  private ttl: number;

  constructor(options: TimedKVPeerOptions) {
    super({ ...options, type: "object" });

    this.ttl = options.ttl ?? kDefaultTtl;
    this.randomKeyGenerator = options.randomKeyCallback ?? kDefaultRandomKeyGenerator;
  }

  override async setValue(options: TimedSetValueOptions<T>): Promise<Result<KeyType, Error>> {
    const { key, ...restOptions } = options;

    const finalKey = key ?? this.randomKeyGenerator();

    await super.setValue({
      ...restOptions,
      key: finalKey,
      expiresIn: this.ttl
    });

    return Ok(finalKey);
  }
}
