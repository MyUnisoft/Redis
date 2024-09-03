<h1 align="center">
  Intrapersonal
</h1>

<p align="center">
  This class is an abstraction of a consumer acting out of a group, handling intrapersonal communication (with himself) through a redis stream.
</p>


## 📚 Usage

```ts
import { Intrapersonal, Connection } from "@myunisoft/redis";

const connection = new Connection();

await connection.initialize();

const consumer = new Intrapersonal({
  connection,
  streamName: "my-stream-name",
  frequency: 10000, 
  lastId: "0-0",
  count: 10
});

const readable = Readable.from(basicStream[Symbol.asyncIterator]());
```

## 📜 API

### consume

Use this method to pull data out of the connected stream.

### cleanStream

Use this method to pull out all data of the connected stream.
