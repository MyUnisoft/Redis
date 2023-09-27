// Import Node.js Dependencies
import { randomBytes } from "node:crypto";

// Import Internal Dependencies
import { KVPeer, KVOptions, SetValueOptions } from "./KVPeer.class";
import { KeyType } from "../types/index";

// CONSTANTS
const kDefaultTtl = 1_000 * 60 * 10;
const kDefaultRandomKeyGenerator = () => randomBytes(6).toString("hex");

export interface TimedKVPeerOptions<T extends object, K extends Record<string, any> | null = null> extends Omit<KVOptions<T, K>, "type"> {
  /** How long the keys are kept, by default set to 10 minutes **/
  ttl?: number;
  /** A random key callback generator for setValue() method **/
  randomKeyCallback?: () => string;
}

interface TimedSetValueOptions<T> extends Omit<SetValueOptions<T>, "expiresIn" | "key"> { key?: string | Buffer };

/**
* @class TimedKVPeer
* @description TimedKVPeer represents an abstraction design to store time-lifed key-value peer. You probably don't need to use this class directly.
*/
export class TimedKVPeer<T extends object, K extends Record<string, any> | null = null> extends KVPeer<T, K> {
  protected randomKeyGenerator: () => string;
  private ttl: number;

  constructor(options: TimedKVPeerOptions<T, K> = {}) {
    super({ ...options, type: "object" });

    this.ttl = options.ttl ?? kDefaultTtl;
    this.randomKeyGenerator = options.randomKeyCallback ?? kDefaultRandomKeyGenerator;
  }

  async setValue(options: TimedSetValueOptions<T>): Promise<KeyType> {
    const { key, value } = options;

    const finalKey = key ?? this.randomKeyGenerator();

    await super.setValue({ key: finalKey, value, expiresIn: this.ttl });

    return finalKey;
  }
}
