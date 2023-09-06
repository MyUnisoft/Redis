<p align="center"><h1 align="center">
  Redis
</h1>

<p align="center">
  MyUnisoft Redis package.
</p>

<p align="center">
    <a href="https://github.com/MyUnisoft/Redis"><img src="https://img.shields.io/github/package-json/v/MyUnisoft/redis?style=flat-square" alt="npm version"></a>
    <a href="https://github.com/MyUnisoft/Redis"><img src="https://img.shields.io/github/license/MyUnisoft/Redis?style=flat-square" alt="license"></a>
    <a href="https://github.com/MyUnisoft/Redis"><img src="https://img.shields.io/github/languages/code-size/MyUnisoft/Redis?style=flat-square" alt="size"></a>
</p>

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) version 14 or higher.
- Docker (for running tests).

> If you ever want to setup a local instance of Redis, please follow [this guide](./docs/Installation.md).

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @myunisoft/redis
# or
$ yarn add @myunisoft/redis
```

## 📚 Usage

> The package export methods to instantiate and close connection to Redis. By default, all features automatically re-use the current Redis connection.

```js
import assert from "assert";
import {
  initRedis,
  getRedis,
  closeAllRedis
} from "@myunisoft/redis";

const publisher = await initRedis();
const subscriber = await initRedis({}, "subscriber");

assert.strictEqual(publisher, getRedis());
assert.strictEqual(subscriber, getRedis("subscriber"));

await closeAllRedis();
```

## 📜 API

export type Instance = "subscriber" | "publisher";

type CustomRedisOptions: Partial<RedisOptions> & {
  port?: number;
  host?: string;
};

### getRedis(instance: Instance = "publisher"): Redis;

> This function return either the publisher instance, either the subscriber instance.

---


### initRedis(redisOptions: CustomRedisOptions = {}, instance: Instance = "publisher"): Promise<Redis>

> This function is used to init redis connections. Passing instance with "subscriber" value, it init the local  subscriber Redis instance. Otherwise, it init the local publisher Redis instance.

---

### getConnectionPerf(instance: Instance = "publisher", redisInstance?: Redis): Promise<GetConnectionPerfResponse>

```ts
export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf?: number;
}
```
> This function is used to check Redis connection state.

```ts
const { isAlive } = await getConnectionPerf(); // true
```

---

### closeRedis(instance: Instance = "publisher", redisInstance?: Redis): Promise<void>

> This function is used to close a single local instance.

---

### closeAllRedis(redisInstance?: [Redis, Redis]): Promise<void>

> This function is used to close every local instances.

---

### clearAllKeys(instance: Instance = "publisher"): Promise<void>

> This function is used to clear all keys from redis db (it doesn't clean up streams or pubsub !).

```ts
await clearAllKeys();
```

The package also exports many classes listed below.

- [KVPeer](./docs/KVPeer.md)
- [TimedKVPeer](./docs/TimedKVPeer.md)
- [RestrictedKV](./docs/RestrictedKV.md)
- [StoreContext](./docs/StoreContext.md)
- [PubSub](./docs/pubsub/Channel.md)
- [Stream](./docs/stream/Stream.md)
  - [Intrapersonal](./docs/stream/Intrapersonal.md)
  - [Interpersonal](./docs/stream/Interpersonal.md)

