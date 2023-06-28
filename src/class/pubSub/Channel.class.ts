// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { getPublisher } from "../..";

export interface ChannelOptions {
  name: string;
  prefix?: string;
}

export type MessageWithMetadata<T, K> = T & {
  metadata: K;
};

export type PublishOptions<
  T extends Record<string, any> = Record<string, any>,
  K extends Record<string, any> | null = null> = K extends null ?
  (T | T[]) : (MessageWithMetadata<T, K> | MessageWithMetadata<T, K>[]);

export class Channel<
  T extends Record<string, any> = Record<string, any>,
  K extends Record<string, any> | null = null>
{
  readonly name: string;
  readonly redis: Redis;

  constructor(options: ChannelOptions, redis?: Redis) {
    const { name, prefix } = options;

    this.redis = typeof redis === "undefined" ? getPublisher() : redis;

    this.name = `${prefix ? `${prefix}-` : ""}` + name
  }

  public async publish(options: PublishOptions<T, K>) {
    await this.redis.publish(this.name, JSON.stringify(options));
  }
}
