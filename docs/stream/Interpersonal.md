<h1 align="center">
  Interpersonal
</h1>

<p align="center">
  This class is an abstraction of a Consumer rattached to a Group to handle interpersonal communication through a redis stream.
</p>

## Interface

```ts
interface ClaimOptions {
  /**
   * Time given for which a claimed entry is idle
   */
  idleTime: number;
}

interface GroupConsumerOptions extends BasementOptions {
  groupName: string;
  consumerName: string;
  claimOptions?: ClaimOptions;
}
```

## 📚 Usage

```ts
const consumer = new GroupConsumer({
  streamName: "my-stream-name",
  groupName: "my-group-name",
  consumerName: "my-consumer-name",
  frequency: 10000, 
  lastId: ">",
  count: 10,
  claimOptions: {
    idleTime: 1000 * 60
  }
});

const readable = Readable.from(firstConsumer[Symbol.asyncIterator]());
readable.on("readable", async() => {
  const chunk: Entry[] = readable.read();

  for (const entry of chunk) {
    await firstConsumer.claimEntry(entry.id);
  }
});
```

## 📜 API

### init

> Use this method to create a new Consumer rattached to the specified groupName, imself rattached to the connected stream.

### consume

> Use this method to pull data out of the connected stream. In the context of a GroupConsumer, you must claim each entry to pull out after you dealed with.

```ts
const entries = await consumer.consume();

for (const entry of entries) {
  await consumer.claimEntry(entry.id);
}
```

### claim

> Use this method to pull data out of another GroupConsumer connected to the stream for data that have been pulled out but not claimed. 

```ts
const entries = await consumer.claim({ idleTime: 1000 * 60 });

for (const entry of entries) {
  await consumer.claimEntry(entry.id);
}
```

### claimEntry

> Use this method to claim and delete an entry on the connected stream. Call this method only after you dealed with your entry data.


### getConsumerData

> Use this method to get information on the current consumer.

### deleteConsumer

> Use this method to delete the current consumer. 
