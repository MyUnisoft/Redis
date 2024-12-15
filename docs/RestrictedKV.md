<h1 align="center">
  RestrictedKV
</h1>

<p align="center">
  This class is used to prevent from brut force attack. It allow to lock key usage on a number of failed attempt.
</p>


## Interface

```ts
type RestrictedKVOptions = Pick<KVOptions<Attempt>, "prefix"> & {
  autoClearExpired?: number;
  allowedAttempt?: number;
  banTimeInSecond?: number;
}

interface Attempt {
  failure: number;
  lastTry: number;
  locked: boolean;
}

type KeyType = string | Buffer;
```

## Constants

- kDefaultAllowedAttempt = 6;
- kDefaultBanTime = 60 * 5;

## 📚 Usage

```ts
import { RestrictedKV, MemoryAdapter } from "@myunisoft/redis";

const allowedAttempt = 2;
const banTime = 60;

const memoryAdapter = new MemoryAdapter();

const restrictedKV = new RestrictedKV({
  adapter: memoryAdapter,
  prefix: "foo-",
  allowedAttempt,
  banTimeInSecond: banTime
});
```

## 📜 API

### getAttempt(key: KeyType): Promise< Attempt >

Returns the number of attempts (failure, last tentative timestamp ...) for a given key.  

```ts
const key: string = "foo"

const attempt = await restrictedKV.getAttempt(key);
const { failure, lastTry, locked } = attempt;

strictEqual(failure, 0);
strictEqual(lastTry, Date.now())
strictEqual(locked, false);
```

### fail(key: KeyType): Promise< Attempt >

Increment an attempt failure for a given key.  
When the number of failures exceeds the defined limitation, the key is locked.  

```ts
const key: string = "foo";

const attempt = await restrictedKV.fail(key);
const { failure, lastTry, locked } = attempt;

strictEqual(failure, 1);
strictEqual(lastTry, Date.now());
strictEqual(locked, false);
```
### success( )

Notify a successful attempt for a given key. This will remove all traces of previous failed attempt.

```ts
const key: string = "foo";

await restrictedKV.success(email);

const attempt = await restrictedKV.getAttempt(key);
const { failure, lastTry, locked } = attempt;

strictEqual(failure, 0);
strictEqual(lastTry, Date.now());
strictEqual(locked, false);
```

### clearExpired()

Clear all keys where the last attempt exceeds an allocated lifetime.

```ts
await restrictedKV.clearExpired()
```

Cast the event `expiredKeys` olding the removed keys.
