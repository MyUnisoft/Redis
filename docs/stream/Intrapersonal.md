<h1 align="center">
  Intrapersonal
</h1>

<p align="center">
  This class is an abstraction of a consumer acting out of a group, handling intrapersonal communication (with himself) through a redis stream.
</p>


## 📚 Usage

```ts
import { Intrapersonal, RedisAdapter } from "@myunisoft/redis";

const redis = new RedisAdapter({
  port: Number(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST
});

await redis.initialize();

const consumer = new Intrapersonal({
  redis,
  streamName: "my-stream-name",
  frequency: 10000, 
  lastId: "0-0",
  count: 10
});

await consumer.init();

const readable = Readable.from(basicStream[Symbol.asyncIterator]());
```

## 📜 API

### consume

Use this method to pull data out of the connected stream.

### cleanStream

Use this method to pull out all data of the connected stream.
