# class StoreContext

## Purpose of StoreContext class

>  A session store designed to preserve the session between several Node.js instances.  
> 
> this class permise to handle a session inside a redis database. You can init a session, destroy it, get session, update sessions properties and view if user is authenticated.
>
> The life-time of a given session is maximum 10 minutes by default.

## Type Definition

```ts
interface Store {
  /** Return callback URL as string **/
  returnTo?: string;
}

interface FrameworkContext {
  getCookie: (cookieName: string) => string;
  setCookie: (cookieName: string, cookieValue: string | null, opts?: CookieSerializeOptions) => void
}
```

## Available methods in StoreContext class

> first of all , you must instantiate the class

```ts
import { StoreContext } from "@myunisoft/redis";

const options = {
  authenticationField: keyof T | null;
  cookiesOptions: SetOption;
}

const store: StoreContext = new StoreContext(options);
```

### initSession( )

this method is used to initialize a session.

```ts
const id = string;
const ctx: FrameworkContext;
const payload = {
  returnTo =  "theCallbackUrl";
}

await store.initSession(id, ctx, payload); // Promise<string>
```

### destroySession();

this method is used to destroy the session

```ts
const ctx: FrameworkContext;

await store.destroySession(ctx) // Promise<void>
```

### getSession();  

this method is used to get a session and his informations if provided

```ts
const ctx: FrameworkContext;

await store.getSession(ctx); // Promise<T | null>
```

### updateSession(); 

this method is used to update the properties of a session 

```ts
// CONSTANTS
const ctx : FrameworkContext;
const props : Partial<T> 

await store.updateSession(ctx, props); // Promise<void>
```

### isUserAuthenticated();

this method return a boolean who represents if an user is authenticated

```ts
// CONSTANTS
const ctx : FrameworkContext; 

await store.isUserAuthenticated(ctx); // Promise<boolean>
```
