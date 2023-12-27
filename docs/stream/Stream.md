<h1 align="center">
  Stream
</h1>

<p align="center">
  This class is an abstraction of common Redis commands designed to work on a Redis Stream.
</p>


## Interface

```ts
interface BasementOptions {
  streamName: string;
  /**
   * Interval of time between two iteration on the stream
   */
  frequency: number;
  /**
   * Reference to the minimal ID we iterate from
   */
  lastId: string;
  /**
   * Number of entries it must pull at each iteration
   */
  count?: number;
}

export interface PushOptions {
  id?: string;
  metadata?: string;
}

interface GetRangeOptions {
  /**
   * Reference to the minimal ID we pull from
   */
  min: string;
  /**
   * Reference to the maximal ID we pull to
   */
  max: string;
  /**
   * Number of max entries pulled out
   */
  count?: number;
}

interface XINFOStreamData {
  length: number;
  radixTreeKeys: number;
  radixTreeNodes: number;
  lastGeneratedId: string;
  entries: utils.Entry[];
  groups?: utils.Group[];
}

interface ConsumeOptions {
  count?: number;
  lastId: string;
}
```


## 📚 Usage

```ts
const redisStream = new Stream({
  streamName: "my-stream-name",
  frequency: 10000, 
  lastId: "0-0",
  count: 10
});
```

## 📜 API

### streamExist

> Use this method to know if a Redis stream exist with the class prop streamName.

```ts
const streamExist = await redisStream.streamExist();
console.log(streamExist) // false
```

### init

> Use this method to create a new Redis stream with the class prop streamName.

```ts
await redisStream.init();

const streamExist = await redisStream.streamExist();
console.log(streamExist) // true
```

### getData

> Use this method to get all information on the connected stream.

### getLength 

> Use this method to get the number of entries on the connected stream.

### getGroupsData

> Use this method to get information on groups attached to the connected stream.

### push

> Use this method to create an entry on the connected stream.

```ts
const entryId = await redisStream.push({ foo: "bar" }); 
console.log(entryId) // 1526985685298-0

const entryId = await redisStream.push({ foo: "bar", bar: 2n }, { id: "any-custom-id", metadata: "" });
console.log(entryId) // "any-custom-id"
```

### delEntry

> Use this method to delete an entry on the connected stream.

```ts
await redisStream.delEntry("any-id");
```

### getRange

> Use this method to get entries for a given range.

```ts
const entries = await redisStream.getRange({ min: "-", max: "+" });
console.log(entries) // [0-0, 0-1, 0-2, 0-3, 0-4, 0-5, 0-6, 0-7, 0-8, 0-9];

const entries = await redisStream.getRange({ min: "-", max: "+", count: 5 });
console.log(entries) // [0-0, 0-1, 0-2, 0-3, 0-4];
```

### getRevRange

> Same as getRange but work in reverse order.

```ts
const entries = await redisStream.getRevRange({ min: "-", max: "+" });
console.log(entries) // [0-9, 0-8, 0-7, 0-6, 0-5, 0-4, 0-3, 0-2, 0-1];

const entries = await redisStream.getRevRange({ min: "-", max: "+" });
console.log(entries) // [0-9, 0-8, 0-7, 0-6, 0-5];
```

### trim

> Use this method to trim the stream for a given max length or minimum id.

```ts
for (let index = 0; index < 100; index++) {
  await push(data: { foo: "bar" })
} 

const deletedEntries = await redisStream.trim(90);
console.log(deletedEntries) // 10
```
