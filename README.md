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
  closeRedis
} from "@myunisoft/redis";

const redis = await initRedis();

assert.strictEqual(redis, getRedis());

await closeRedis();
```

## 📜 API

### getConnectionPerf(extInstance?: Redis): Promise<GetConnectionPerfResponse>

```ts
export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf?: number;
}
```

> This method is used to check Redis connection state.

```ts
const { isAlive } = await getConnectionPerf(); // true
```

### clearAllKeys(extInstance?: Redis): Promise<void>

> This function is used to clear all keys from redis.

```ts
await clearAllKeys();
```

The package also exports many classes listed below.

- [KVPeer](./docs/KVPeer.md)
- [TimedKVPeer](./docs/TimedKVPeer.md)
- [RestrictedKV](./docs/RestrictedKV.md)
- [PubSub](./docs/pubsub/Channel.md)
- [Stream](./docs/stream/Stream.md)
  - [Intrapersonal](./docs/stream/Intrapersonal.md)
  - [Interpersonal](./docs/stream/Interpersonal.md)

