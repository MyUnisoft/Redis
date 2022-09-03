// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { getRedis } from "../..";

export interface ChannelOptions {
  name: string;
  prefix?: string;
}

export interface PublishOptions<T> {
  event: string;
  data: any;
  metadata: T;
}

export class Channel<T = Record<string, any> | void> {
  protected name: string;
  protected prefix: string;

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
    await this.redis.publish(this.prefix + this.name, JSON.stringify(options));
  }
}
