# Class SessionStore

## Purpose of SessionStore class

> Session Store represents a time-lifed store.   
> 
> You probably don't need to use or instanciate this class directly.
>
> The life-time of a given session is maximum 10 minutes by default.

## Third-party requirement in a Node.js project

After redis server was launched, inside the terminal:
```bash
$ npm i @myunisoft/redis -P
```

## Methods

> first of all , you must instantiate the class

```ts
// third-party requirement
import { SessionStore } from "@myunisoft/redis";

const options = {
  useSharedTimeMap: boolean, // false by default & optional
  sessionDuration: number, // 10 minutes by default & optional
  randomKeyCallback, // optional otherwise a key is generated
}

// creating an instance
const store: SessionStore = new SessionStore(options);
```

### setValue( )

this method is used to set a value paired to a key in time-lifed store.

```ts
let value: Partial<T>;
let key:string; // optional

store.setValue(value, key);

// return value
Promise<string>
```

### deleteValue();
this method is used to delete a Key Value pair.

```ts
const key: string; 

store.deleteValue(key);

// return value
Promise<number>
```
