// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { getRedis } from "../..";

export interface ChannelOptions {
  name: string;
  prefix?: string;
}

export interface Message<K> {
  event: string;
  data: K;
}

export type MessageWithMetadata<K, T> = Message<K> & {
  metadata: T;
};

export type PublishOptions<T = any, K = any> = T extends Record<string, any> ? MessageWithMetadata<K, T> : Message<K>;

export class Channel<T = any, K = any> {
  readonly name: string;

  constructor(options: ChannelOptions, redis?: Redis) {
    const { name, prefix } = options;

    if (redis) {
      this.redis = redis;
    }

    this.name = `${prefix ? `${prefix}-` : ""}` + name
  }

  set redis(extInstance: Redis) {
    this.redis = extInstance;
  }

  get redis() {
    return getRedis();
  }

  public async publish(options: PublishOptions<T, K>) {
    await this.redis.publish(this.name, JSON.stringify(options));
  }
}
