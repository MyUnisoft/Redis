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

- [Node.js](https://nodejs.org/en/) version 20 or higher.
- Docker (for running tests).

> [!TIP]
> If you ever want to setup a local instance of Redis,  
> you can follow the [Redis documentation](https://redis.io/docs/getting-started/) for Mac,  
> or, you can use [Memurai](https://www.memurai.com/) for Windows.

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @myunisoft/redis
# or
$ yarn add @myunisoft/redis
```

---

<p align="center">
  There are multiple adapters to exploit the different abstractions available.
</p>

- Adapter
  - [MemoryAdapter](./docs/adapter/memory.adapter.md)
  - [RedisAdapter](./docs/adapter/redis.adapter.md)
- Abstraction
  - [KVPeer](./docs/KVPeer.md)
  - [TimedKVPeer](./docs/TimedKVPeer.md)
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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=80" width="80px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/MyUnisoft/Redis/pulls?q=is%3Apr+reviewed-by%3APierreDemailly" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=PierreDemailly" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fraxken"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=80" width="80px;" alt="Thomas.G"/><br /><sub><b>Thomas.G</b></sub></a><br /><a href="https://github.com/MyUnisoft/Redis/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=fraxken" title="Tests">⚠️</a> <a href="https://github.com/MyUnisoft/Redis/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/MyUnisoft/Redis/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
