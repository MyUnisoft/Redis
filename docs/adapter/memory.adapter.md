<h1 align="center">
  MemoryAdapter
</h1>

<p align="center">
  This class is a basic in-memory database adapter.
</p>

## Interface

```ts
export interface InMemSetValueOptions {
  key: string;
  value: unknown;
  expiresIn?: number;
}

export interface InMemIsKeyExpiredOptions {
  value: Record<string, unknown>;
  banTimeInSecond: number;
}
```

## 📚 Usage

```ts
import { MemoryAdapter } from "@myunisoft/redis";

const memoryAdapter = new MemoryAdapter();
```

## 📜 API

### constructor< T = unknown >()

### setValue(options: InMemSetValueOptions<T>): Promise< Result< KeyType, SetValueError > >

this method is used to set a key-value pair in memory

```ts
const key = "foo";
const value = {
  foo: "bar",
};

await memoryAdapter.setValue({ key, value });
```

### deleteValue(key: string): Promise< number >

this method is used to delete a key-value pair in memory

```ts
const key = "foo";

const result = await memoryAdapter.deleteValue(key);

console.log(result); // 0 for Failure, 1 for Success
```

### getValue(key: string): Promise< T | null >

this method is used to get a value from memory

```ts
const key = "foo";

const result = await memoryAdapter.getValue(key);

console.log(result); // { foo: "bar" }
``` 

### flushall()

this method is used to clear all key-value pairs in memory

```ts
await memoryAdapter.flushall();
``` 
