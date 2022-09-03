# Intrapersonal

This class is an abstraction of a consumer acting out of a group, handling intrapersonal communication (with himself) through a redis stream.


## Usage

```ts
const consumer = new Intrapersonal({
  streamName: "my-stream-name",
  frequency: 10000, 
  lastId: "0-0",
  count: 10
});

const readable = Readable.from(basicStream[Symbol.asyncIterator]());
```

### consume

> Use this method to pull data out of the connected stream.

### cleanStream

> Use this method to pull out all data of the connected stream.
