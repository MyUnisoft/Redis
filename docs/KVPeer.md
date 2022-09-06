# class RedisKV

## 1. Purpose of the class

> This class is used to store and retrieve key-value pairs in Redis.

> After redis server was launched, inside the terminal:
```bash
$ npm i @myunisoft/redis -P
```

## 2. type definition

```ts
interface Attempt {
  failure: number; // number of attempt
  lastTry: number; // timeStamp representing last try
  locked: boolean; // it represent if user is locked
}
```

## 3. Default value

- kDefaultKVType = "raw"

## 4. Options for instanciation
> you can define an uniq prefix for all key by instance.

```ts
options = { prefix: "myprefix-" };

// expected key is myprefix-key
```

> you can define the type of value passed to the keys inside instance

```ts
// allowed types are:
options = { type: "raw"}
options = { type: "object"}
```

> you can define a function to process the retrieved value

```ts
options = {
  mapValue: (value: number) => {
    return value * 2;
  }
}
```

## 5. Methods on this class

> first of all , you must instantiate the class

```ts
// third-party requirement
import { RedisKV } from "@myunisoft/redis";

// creating an instance
const handler: RedisKV = new RedisKV(options);
```

### setValue( )

> this method is used to set a key-value pair in Redis

```ts
let key: string = "key";
let value: Partial<T>;

handler.setValue(value, key);

// return value
Promise<string>
```

### getValue( )

> this method is used to get a value from Redis

```ts
let key: string = "key";

handler.getValue(let);

// return value
Promise< T || null >
```

### deleteValue( )

> this method is used to delete a key-value pair

```ts
let key: string = "key";

handler.deleteValue("key");

// return value
Promise< number > // O otherwise 1 if success
```
