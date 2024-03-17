<h1 align="center">
  TimedKVPeer
</h1>

<p align="center">
  Represents an abstraction design to store time-lifed key-value peer.
</p>

## Interface

```ts
export interface TimedKVPeerOptions<T extends object, K extends Record<string, any> | null = null> extends Omit<KVOptions<T, K>, "type"> {
  /** How long the keys are kept, by default set to 10 minutes **/
  ttl?: number;
  /** A random key callback generator for setValue() method **/
  randomKeyCallback?: () => string;
}
```

## 📚 Usage

```ts
import { TimedKVPeer } from "@myunisoft/redis";

interface MyCustomObject {
  foo: string;
  life: number;
  isReal: boolean;
}

function randomKeyCallback() {
  return randomBytes(128).toString("hex");
}

const store = new TimedKVPeer<MyCustomObject>({
  sessionDuration: 3600,
  randomKeyCallback
});
```

## 📜 API

### setValue(value: T, key?: KeyType): Promise< KeyType >

this method is used to set a key-value peer

```ts
const value: MyCustomObject = {
  foo: "bar",
  life: 0,
  isReal: true
};

const finalKey = await store.setValue(value);

console.log(finalKey);
```

### deleteValue(key: KeyType): Promise< number >;

this method is used to delete a key-value peer

```ts
const res = await store.deleteValue(finalKey);

console.log(res) // 0 for Failure, 1 for Success
```
