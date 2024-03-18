<h1 align="center">
  Channel
</h1>

<p align="center">
  This class is used to publish on a prefixed channel using the Redis PubSub.
</p>

## Interface

```ts
export interface ChannelOptions {
  name: string;
  prefix?: string;
}

export type MessageWithMetadata<T, K> = T & {
  metadata: K;
};

export type PublishOptions<
  T extends Record<string, any> = Record<string, any>,
  K extends Record<string, any> | null = null> = K extends Record<string, any> ?
    (MessageWithMetadata<T, K> | MessageWithMetadata<T, K>[]) : (T | T[]);
```

## 📚 Usage

```ts
import { Channel } from "@myunisoft/redis";

const name = "foo";

const subscriber = await initRedis(options, true);
await subscriber.subscribe(name);
subscriber.on("message", (channel, message) => {
  // Handle incoming event
});

const channel = new Channel({ name });
```

## 📜 API

### publish(options: PublishOptions< T, K >): Promise< void >

Publish an event on the pubsub channel

```ts
await channel.publish({ data: { foo: "bar" }});
```
