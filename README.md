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


### initRedis(redisOptions: CustomRedisOptions = {}, instance: Instance = "publisher", external?: boolean): Promise<Redis>

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

### closeRedis(instance: Instance = "publisher", redisInstance?: Redis, forceExit: boolean = false): Promise<void>

> This function is used to close a single local instance.

---

### closeAllRedis(redisInstance?: [Redis, Redis], forceExit: boolean = false): Promise<void>

> This function is used to close every local instances.

---

### clearAllKeys(instance: Instance = "publisher", redis?: Redis): Promise<void>

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


## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/nicolas-hallaert/"><img src="https://avatars.githubusercontent.com/u/39910164?v=4?s=80" width="80px;" alt="Nicolas Hallaert"/><br /><sub><b>Nicolas Hallaert</b></sub></a><br /><a href="https://github.com/MyUnisoft/Redis/commits?author=Rossb0b" title="Code">💻</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=Rossb0b" title="Tests">⚠️</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=Rossb0b" title="Documentation">📖</a> <a href="https://github.com/MyUnisoft/Redis/pulls?q=is%3Apr+reviewed-by%3ARossb0b" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=80" width="80px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/MyUnisoft/Redis/pulls?q=is%3Apr+reviewed-by%3APierreDemailly" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fraxken"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=80" width="80px;" alt="Thomas.G"/><br /><sub><b>Thomas.G</b></sub></a><br /><a href="https://github.com/MyUnisoft/Redis/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=fraxken" title="Tests">⚠️</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/MyUnisoft/Redis/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
