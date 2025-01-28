// Import Internal Dependencies
import { RedisAdapter } from "../adapter/redis.adapter.js";

export type ChannelOptions = {
  redis: RedisAdapter;
  name: string;
};

export type MessageWithMetadata<T, K> = T & {
  metadata: K;
};

export type PublishOptions<
  T extends Record<string, any> = Record<string, any>,
  K extends Record<string, any> | null = null> = K extends null ?
    (T | T[]) : (MessageWithMetadata<T, K> | MessageWithMetadata<T, K>[]);

export class Channel<
  T extends Record<string, any> = Record<string, any>,
  K extends Record<string, any> | null = null> {
  readonly name: string;

  #redis: RedisAdapter;

  constructor(options: ChannelOptions) {
    const { name, redis } = options;

    this.name = name;
    this.#redis = redis;
  }

  public async pub(options: PublishOptions<T, K>) {
    await this.#redis.publish(this.name, JSON.stringify(options));
  }
}
