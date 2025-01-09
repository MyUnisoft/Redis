<h1 align="center">
  KVPeer
</h1>

<p align="center">
  This class is used to store, retrieve and delete key-value pairs in Redis.
</p>

## 📚 Usage

```ts
import { KVPeer, RedisAdapter } from "@myunisoft/redis";

const redisAdapter = new RedisAdapter();
await redisAdapter.initialize();

const kvPeer = new KVPeer({
  type: "raw",
  adapter: redisAdapter,
});

await kvPeer.setValue({ key: "myKey", value: "boo" });
const value = await kvPeer.getValue("myKey"); // "boo"
```

## 📜 API

### constructor(options: KVOptions<T>)

You can instantiate a new `KVPeer` object by passing the following options:
- `adapter: DatabaseConnection` - the database connection object.
- `type?: KVType` - the type of the value that will be stored in Redis. It can be either `"raw"` or `"object"`. Default is `"raw"`.
- `mapValue?: KVMapper<T, K>` - a function that will be used to map the value before storing it in Redis (only for `"object"` type). There is no map by default.
- `prefix?: string` - a prefix that will be added to the key before storing it in Redis.
- `prefixSeparator?: string` - a separator that will be used to separate the prefix from the key. Default is `"-"`.

### setValue(options: KVPeerSetValueOptions<T>): Promise<Result<KeyType, Error>>

This method is used to set a key-value pair in Redis.

```ts
const key = "foo";
const value = {
  bar: "baz",
};

const result = await kvPeer.setValue({ key, value });
if (result.err) {
  console.error(result.val);
}
```

Options are defined as follows:

- `key` - the key that will be used to store the value in Redis.
- `value` - the value that will be stored in Redis.
- `expiresIn` - the time in **seconds** after which the key will expire.

```ts
export interface RedisSetValueOptions<T extends StringOrObject = Record<string, any>> {
  key: KeyType;
  value: Partial<T>;
  type: KVType;
  expiresIn?: number;
}

export type KVPeerSetValueOptions<T extends StringOrObject = StringOrObject> = Omit<
  RedisSetValueOptions<T>,
  "type"
>;
```

### getValue(key: KeyType): Promise<MappedValue<T, K> | null >

This method is used to get a value in Redis.

```ts
const value = await kvPeer.getValue("foo");
// { bar: "baz" }
```

### deleteValue(key: KeyType): Promise<number>

This method is used to delete a key-value pair in Redis.

```ts
const result = await kvPeer.deleteValue("key");

console.log(result); // 0 for Failure, 1 for Success
```

## Usage with `mapValue`

```ts
const kvPeer = new KVPeer({
  type: "object",
  adapter: redisAdapter,
  mapValue: (value) => {
    return {
      ...value,
      metadata: {
        bar: "baz",
      },
    };
  },
});

await kvPeer.setValue({ key: "myKey", value: { foo: "foz" } });
const value = await kvPeer.getValue("myKey");
// { foo: "foz", metadata: { bar: "baz" } }
```

## Interface

```ts
export type KeyType = string | Buffer;
export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> =
  K extends Record<string, any> ? T & { customData: K; } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
  IsMetadataDefined<T, K> : T;

export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
  adapter: DatabaseConnection;
  type?: KVType;
  mapValue?: KVMapper<T, K>;
  prefix?: string;
  prefixSeparator?: string;
}
```
