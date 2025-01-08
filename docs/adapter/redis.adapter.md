<h1 align="center">
  RedisAdapter
</h1>

<p align="center">
  This class is a basic redis database adapter.
</p>

## Interface

```ts
export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

export interface GetConnectionPerfResponse {
  isAlive: boolean;
  perf: number;
}

export interface ClearExpiredOptions {
  banTimeInSecond: number;
}

export type RedisIsKeyExpiredOptions = ClearExpiredOptions & {
  key: KeyType;
};

export interface RedisSetValueOptions<T extends StringOrObject = Record<string, any>> {
  key: KeyType;
  value: Partial<T>;
  type: KVType;
  expiresIn?: number;
}

export type RedisAdapterOptions = Partial<RedisOptions> & {
  attempt?: number;
  disconnectionTimeout?: number;
};
```

## Constants

```ts
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;
```

## 📚 Usage

```ts
import { RedisAdapter } from "@myunisoft/redis";

const redisAdapter = new RedisAdapter();
```

## 📜 API

### setValue(options: RedisSetValueOptions<T>): Result<KeyType, SetValueError>

this method is used to set a key-value pair in redis

```ts
const key = "foo";
const value = {
  foo: "bar",
};

await redisAdapter.setValue({ key, value });
```

### getValue(key: KeyType): null | unknown

this method is used to get a value from redis

```ts
const key = "foo";

const result = await redisAdapter.getValue(key);

console.log(result); // { foo: "bar" }
```

### deleteValue(key: KeyType): number

this method is used to delete a key-value pair in redis

```ts
const key = "foo";

const result = await redisAdapter.deleteValue(key);

console.log(result); // 0 for Failure, 1 for Success
``` 

### clearExpired(options: ClearExpiredOptions): (string | Buffer)[]

this method is used to clear expired key-value pairs in redis

```ts
const result = await redisAdapter.clearExpired({ banTimeInSecond: 10 });

console.log(result); // []
```

### isKeyExpired(options: RedisIsKeyExpiredOptions): boolean

this method is used to check if a key is expired in redis

```ts
const key = "foo";

const result = await redisAdapter.isKeyExpired({ key, banTimeInSecond: 10 });

console.log(result); // false
```

### deepParseInput(input: Record<string, any> | any[]): Generator<string | Record<string, any> | any[]>

this method is used to deep parse input

```ts
const input = { foo: "bar" };

const result = await redisAdapter.deepParseInput(input);

console.log(result); // { foo: "bar" }
``` 

### parseInput(object: Record<string, any>): Record<string, any>

this method is used to parse input

```ts
const input = { foo: "bar" };

const result = await redisAdapter.parseInput(input);

console.log(result); // { foo: "bar" }
```

