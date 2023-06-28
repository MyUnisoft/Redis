// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { getRedis } from "../..";

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

  constructor(options: ChannelOptions) {
    const { name, prefix } = options;

    this.name = `${prefix ? `${prefix}-` : ""}` + name
  }

  get redis() {
    return getRedis();
  }

  public async publish(options: PublishOptions<T, K>) {
    await this.redis.publish(this.name, JSON.stringify(options));
  }
}
