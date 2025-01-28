<h1 align="center">
  Channel
</h1>

<p align="center">
  This class is used to publish on a channel using the Redis PubSub.
</p>

## Interface

```ts
export interface ChannelOptions {
  redis: RedisAdapter;
  name: string;
}

export type MessageWithMetadata<T, K> = T & {
  metadata: K;
};

export type PublishOptions<
  T extends Record<string, any> = Record<string, any>,
  K extends Record<string, any> | null = null> = K extends null ?
    (T | T[]) : (MessageWithMetadata<T, K> | MessageWithMetadata<T, K>[]);
```

## 📚 Usage

```ts
import { Channel } from "@myunisoft/redis";

const name = "foo";
const redis = new RedisAdapter({
  port: Number(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST
});
const subscriber = new RedisAdapter({
  port: Number(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST
});

await redis.initialize();

await subscriber.subscribe(name);
subscriber.on("message", (channel, message) => {
  // Handle incoming event
});

const channel = new Channel({
  redis,
  name
});
```

## 📜 API

### pub(options: PublishOptions< T, K >): Promise< void >

Publish an event on the pubsub channel

```ts
await channel.pub({ data: { foo: "bar" }});
```
