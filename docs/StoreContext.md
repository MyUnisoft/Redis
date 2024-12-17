<h1 align="center">
  StoreContext
</h1>

<p align="center">
  A session store designed to preserve the session between several Node.js instances. <br/>
  This class allow to handle a session inside a Redis DB. You can init a session, destroy it, get session, update sessions properties and check if user is authenticated. <br/>
  The life-time of a given session is maximum 10 minutes by default.
</p>

## Interface

```ts
interface Store {
  /** Return callback URL as string **/
  returnTo?: string;
}

interface FrameworkContext {
  getCookie: (cookieName: string) => string;
  setCookie: (cookieName: string, cookieValue: string | null, opts?: CookieSerializeOptions) => void
}

interface StoreContextOptions<T extends Store> extends TimedKVPeerOptions<T> {
  /** Property name used in isUserAuthenticated() method to define if the user is authenticated or not **/
  authenticationField?: keyof T;
  /** HTTP Cookies options. Will be used when creating the session cookie. **/
  setCookiesOptions?: CookieSerializeOptions;
}
```

## 📚 Usage

```ts
import { StoreContext, MemoryAdapter } from "@myunisoft/redis";

const memoryAdapter = new MemoryAdapter();

const options = {
  adapter: memoryAdapter,
  authenticationField: keyof T | null;
  cookiesOptions: SetOption;
}

const store: StoreContext = new StoreContext(options);
```

## 📜 API

### initSession(id: string, ctx: FrameworkContext, payload: Store & T): Promise< InitSessionResponse >

this method is used to initialize a session.

```ts
type InitSessionResponse = Result<string, "id must not be an empty string">;

const id = "foo";
const payload = {
  returnTo =  "theCallbackUrl";
}

const sessionResult = await store.initSession(id, ctx, payload);

if (sessionResult.ok) {
  const id = sessionResult.unwrap(); // "foo"
}
```

### destroySession(ctx: FrameworkContext): Promise< void >

this method is used to destroy the session.

```ts
await store.destroySession(ctx);
```

### getSession(ctx: FrameworkContext): Promise< T | null >

this method is used to get a session and attached data.

```ts
await store.getSession(ctx);
```

### updateSession(ctx: FrameworkContext, payload: Partial< T >): Promise< void >

this method is used to update the properties of a session.

```ts
const payload = {
  returnTo: "foo"
};

await store.updateSession(ctx, payload);
```

### isUserAuthenticated(): Promise< void >

this method return a boolean to know if an user is authenticated.

```ts
await store.isUserAuthenticated(ctx);
```
