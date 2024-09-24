// Import Internal Dependencies
// import { Connection } from "../../index.js";
import { RedisAdapter, RedisAdapterOptions } from "../adapter/redis.adapter.js";

export type ChannelOptions = RedisAdapterOptions & {
  name: string;
  prefix?: string;
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
  K extends Record<string, any> | null = null> extends RedisAdapter {
  readonly name: string;

  constructor(options: ChannelOptions) {
    const { name, prefix } = options;

    super({ ...options });

    this.name = `${prefix ? `${prefix}-` : ""}` + name;
  }

  public async pub(options: PublishOptions<T, K>) {
    await this.publish(this.name, JSON.stringify(options));
  }
}
