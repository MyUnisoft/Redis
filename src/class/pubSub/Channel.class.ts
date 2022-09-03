// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { getRedis } from "../..";

export interface ChannelOptions {
  name: string;
  prefix?: string;
}

export interface Message {
  event: string;
  data: any;
}

export type MessageWithMetadata<T> = Message & {
  metadata: T;
};

export type PublishOptions<T> = T extends Record<string, any> ? MessageWithMetadata<T> : Message;

export class Channel<T = void> {
  readonly name: string;
  readonly prefix: string;

  constructor(options: ChannelOptions, redis?: Redis) {
    if (redis) {
      this.redis = redis;
    }
    this.name = options.name;
    this.prefix = options.prefix ?? "";
  }

  set redis(extInstance: Redis) {
    this.redis = extInstance;
  }

  get redis() {
    return getRedis();
  }

  public async publish(options: PublishOptions<T>) {
    await this.redis.publish(`${this.prefix ? `${this.prefix}-` : ""}` + this.name, JSON.stringify(options));
  }
}
