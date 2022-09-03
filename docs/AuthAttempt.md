# class AuthAttempt

## 1. Purpose of the class

> - With this class , you can handle some operation on an Auth Attempt. You can have some information like number of attempt & more. 
> - The Main feature of this class is to prevent from brut force attack

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

options = (
  // optional "auth-" by default
  prefix: string; 
)
```

## 3. Default value

- allowed attempt : 20 times
- ban time : 300 seconds

## 4. Options for instanciation

> you can define an uniq prefix for all key by instance.

```ts
options = { prefix: "myprefix-" };

// expected key is myprefix-key
```

## 5. Methods on this class

> first of all , you must instantiate the class

```ts
// Core-module requirement
import {strictEqual} from "assert";
// third-party requirement
import { AuthAttempt } from "@myunisoft/redis";

// creating an instance
const handler: AuthAttempt = new AuthAttempt();
```

### getAttempt( ) 
> Returns the number of connection attempts (failure, last tentative timestamp ...) for a given email.  
> email param is passed WITHOUT prefix

```ts
// syntax
let email : string = "something@domain.com"

handler.getAttempt( email );

// return value
Promise<null | Attempt>

// code example & output values
const mail = "address@domain.com";
const nonExistMail = "non-exist-in-@database.com";

const result = await handler.getAttempt( mail );
let { failure, lastTry, locked } = result;

strictEqual( failure, 2); // true
strictEqual( lastTry, 1234567890111213); // true
strictEqual( locked, false); // true

// expected output for non existing mail in database
strictEqual( result, null ); // true
```

### fail( )

> Increment an authentication failure for a given user.  
  The method also allows to define whether an account is locked or not (when the number of failures exceeds the defined limitation).  
> email param is passed WITHOUT prefix

```ts
// syntax
let email: string = "adress@domain.com";

handler.fail( email )

// return value
Promise<Attempt>

// code example & output values
const mail = "address@domain.com";
const lockedMail = "locked@mail.com";

const result = await handler.fail( mail );
let { failure, lastTry, locked } = result;

// expected output with mail
strictEqual( failure, 2); // true
strictEqual( lastTry, 1234567890111213); // true
strictEqual( locked, false); // true

// expected output with lockedMail
strictEqual( failure, 32); // true
strictEqual( lastTry, 1234567890111213); // true
strictEqual( locked, true); // true
```
### success( )

> Notify a successful authentication for a given user. This will remove all traces of previous failed connections.  
> email param is passed WITHOUT prefix
```ts
// syntax
let email: string = "adress@domain.com";

handler.success( email )

// return value
Promise<void>

// code example & output values
const mail = "address@domain.com";

await handler.success( mail );
```

### clearExpired( )

> Searches for all keys where the last attempt exceeds an allocated lifetime and clear (delete) them.

```ts
// syntax
handler.clearExpired( )

// return value
Promise<void>

// code example & output values
handler.clearExpired( );
```
