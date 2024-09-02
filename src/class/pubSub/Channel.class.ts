// Import Internal Dependencies
import { Connection } from "../../index.js";

export interface ChannelOptions {
  name: string;
  connection: Connection;
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
  K extends Record<string, any> | null = null> {
  readonly name: string;

  #connection: Connection;

  constructor(options: ChannelOptions) {
    const { name, prefix } = options;

    this.name = `${prefix ? `${prefix}-` : ""}` + name;
    this.#connection = options.connection;

    if (!this.#connection.isAlive) {
      throw new Error("Redis connection not initialized");
    }
  }

  public async publish(options: PublishOptions<T, K>) {
    await this.#connection.publish(this.name, JSON.stringify(options));
  }
}
