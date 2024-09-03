<h1 align="center">
  RedisKV
</h1>

<p align="center">
  This class is used to store and retrieve key-value pairs in Redis.
</p>

## Interface

```ts
export type KVType = "raw" | "object";

export type StringOrObject = string | Record<string, any>;

type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> = K extends Record<string, any> ? T & { customData: K } : T;

type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ?
IsMetadataDefined<T, K> : T;

// How to restraint usage of the mapValue fn while T extends string?
export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;

export class KVPeer<T extends StringOrObject = StringOrObject, K extends Record<string, any> | null = null> extends EventEmitter {
  connection: Connection;
  prefix?: string;
  type?: KVType;
  mapValue?: KVMapper<T, K>;
}

export interface SetValueOptions<T> {
  key: KeyType;
  value: T;
  expiresIn?: number;
}
```

## Constants

- kDefaultKVType = "raw"

## 📚 Usage

```ts
import { RedisKV, Connection } from "@myunisoft/redis";

interface MyCustomObject {
  foo: string;
}

interface Metadata {
  bar: string;
}

const connection = new Connection();

await connection.initialize();

const options: KVOptions<MyCustomObject, Metadata> = {
  connection,
  prefix: "local",
  type: "object",
  mapValue: (value: MyCustomObject) => {
    value.metadata = {
      bar: "foo"
    };
    
    return value;
  }
}

const customKvWrapper = new RedisKV<MyCustomObject, Metadata>(options);
```

## 📜 API

### setValue(options: SetValueOptions< T >): Promise< KeyType >

this method is used to set a key-value pair in Redis

```ts
const key = "foo";
const value: MyCustomObject = {
  foo: "bar",
};

await customKvWrapper.setValue(key, value); // "local-foo"
```

### getValue(key: KeyType): Promise< MappedValue< T, K > | null >

this method is used to get a value from Redis

```ts
const returnValue = await customKvWrapper.getValue(key);

console.Log(returnValue);
/*
  {
    foo: "bar",
    customData: {
      bar: "foo"
    }
  }
*/
```

### deleteValue(key: KeyType): Promise< number >

this method is used to delete a key-value pair

```ts
const result = await customKvWrapper.deleteValue("key");

console.log(result); // 0 for Failure, 1 for Success
```
