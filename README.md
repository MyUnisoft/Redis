<p align="center"><h1 align="center">
  Redis
</h1>

<p align="center">
  MyUnisoft Redis package.
</p>

<p align="center">
    <a href="https://github.com/MyUnisoft/events"><img src="https://img.shields.io/github/package-json/v/MyUnisoft/events?style=flat-square" alt="npm version"></a>
    <a href="https://github.com/MyUnisoft/events"><img src="https://img.shields.io/github/license/MyUnisoft/events?style=flat-square" alt="license"></a>
    <a href="https://github.com/MyUnisoft/events"><img src="https://img.shields.io/github/languages/code-size/MyUnisoft/events?style=flat-square" alt="size"></a>
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

> The package export methods to instantiate and close connection to Redis. By default, all features automatically re-use current active Redis connection.

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

The package exports a class that will allow you to perform create, update, get and delete operations without any difficulty (on raw or object values).

```ts
import { RedisKV } from "@myunisoft/redis";

interface MyCustomObject {
  foo: string;
  life: number;
  isReal: boolean;
}

const customKvWrapper = new RedisKV<MyCustomObject>({
  type: "object"
});

await customKvWrapper.setValue({ foo: "bar", life: 10, isReal: true }, "key");

const obj = await customKvWrapper.getValue("key");
console.log(obj);
```

## 📜 API

- [RedisKV](./docs/KVPeer.md)
- [SessionStore](./docs/SessionStore.md)
- [StoreContext](./docs/StoreContext.md)
- [AuthAttempt](./docs/RestrictedKV.md)
- [Stream](./docs/stream/Stream.md)
  - [Intrapersonal](./docs/stream/Intrapersonal.md)
  - [Interpersonal](./docs/stream/Interpersonal.md)

