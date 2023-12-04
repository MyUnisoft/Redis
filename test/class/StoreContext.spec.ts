// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, it, mock } from "node:test";
import EventEmitter from "node:events";

// Import Internal Dependencies
import {
  initRedis,
  closeAllRedis,
  clearAllKeys,
  StoreContext,
  Store
} from "../../src/index";
import { randomValue } from "../fixtures/utils/randomValue";

// Constants & variables
const kDefaultCookieOptions = { sameSite: "none", secure: true };

// type Definition
interface CustomStore extends Store {
  mail?: string;
}

describe("StoreContext", () => {
  before(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
    await clearAllKeys();
  });

  after(async() => {
    await closeAllRedis();
  });

  describe("Store Context initialization's suite", () => {
    let sessionContext: StoreContext;

    it("should be instance of EventEmitter & StoreContext", () => {
      sessionContext = new StoreContext<CustomStore>({
        authentificationField: "mail",
        ttl: 3600,
        randomKeyCallback: () => "randomKey"
      });

      assert.ok(sessionContext instanceof StoreContext);
      assert.ok(sessionContext instanceof EventEmitter);
    });
  });

  function createFrameworkCtx(): any {
    return {
      getCookie: () => void 0,
      setCookie: () => void 0
    };
  }

  // initSession SUITE
  describe("Store Context initSession suite", () => {
    let sessionContext: StoreContext;

    before(() => {
      sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail", prefix: "store-context-" });
    });

    it("should throw an error if id is an empty string", async() => {
      const ctx = createFrameworkCtx();
      const payload = { returnTo: "http://localhost/" };

      await assert.rejects(async() => sessionContext.initSession("", ctx, payload), {
        name: "Error",
        message: "id must not be an empty string"
      });
    });

    it("should return the final key when init success", async() => {
      const key = randomValue();
      const ctx = createFrameworkCtx();

      assert.equal(await sessionContext.initSession(key, ctx, {}), key);
    });

    it("should set a cookie when initSession() has been call", async() => {
      const ctx = createFrameworkCtx();
      const payload = { returnTo: "http://localhost/" };
      const sessionId = "A";

      const mockSetCookie = mock.method(ctx, "setCookie", ctx.setCookie);
      await sessionContext.initSession(sessionId, ctx, payload);

      assert.equal(mockSetCookie.mock.calls.length, 1);
      assert.deepEqual(mockSetCookie.mock.calls[0].arguments, ["session-id", sessionId, kDefaultCookieOptions]);
    });
  });

  // destroySession Suite
  describe("Store Context destroySession suite", () => {
    let sessionContext: StoreContext;

    before(() => {
      sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail" });
    });

    it("should throw error if there is no cookie `session-id`", async() => {
      const ctx = createFrameworkCtx();

      await assert.rejects(async() => sessionContext.destroySession(ctx), {
        name: "TypeError",
        message: "Unable to found any cookie session-id. Your session is probably expired!"
      });
    });

    it("should correctly destroy session", async() => {
      const ctx = createFrameworkCtx();
      const payload = { returnTo: "http://localhost/" };
      const sessionId = "A";

      const mockSetCookie = mock.method(ctx, "setCookie", ctx.setCookie);
      await sessionContext.initSession(sessionId, ctx, payload);
      ctx.getCookie = () => sessionId;
      ctx["session-id"] = sessionId;
      await sessionContext.destroySession(ctx);

      assert.equal(mockSetCookie.mock.calls.length, 2);
    });
  });

  // getSession SUITE
  describe("Store Context getSession suite", () => {
    let sessionContext: StoreContext;

    before(() => {
      sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail" });
    });

    it("should return the session if available", async() => {
      const ctx = createFrameworkCtx();
      const payload = { returnTo: "false" };
      const sessionId = "A";

      await sessionContext.initSession(sessionId, ctx, payload);
      ctx.getCookie = () => sessionId;
      ctx["session-id"] = sessionId;

      assert.equal((await sessionContext.getSession(ctx))!.returnTo, false);
    });
  });


  // isAuthenticated SUITE
  describe("Store Context isUserAuthenticated suite", () => {
    let sessionContext: StoreContext;

    before(() => {
      sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail" });
    });

    it("should return false for an undefined `session-id` cookie", async() => {
      const ctx = createFrameworkCtx();

      assert.equal(await sessionContext.isUserAuthenticated(ctx), false);
    });

    it("should return false if there is no data stored for the `session-id` cookie", async() => {
      const ctx = createFrameworkCtx();

      sessionContext.initSession("non-null", ctx, {});
      ctx["session-id"] = "non-null";
      ctx.getCookie = () => "session-id";
      sessionContext.destroySession(ctx);

      assert.equal(await sessionContext.isUserAuthenticated(ctx), false);
    });

    it("should return true for a `session-id` cookie having data stored", async() => {
      const noAuthOptionsContext = new StoreContext();
      const ctx = createFrameworkCtx();

      await sessionContext.initSession("user", ctx, {});

      assert.ok(() => sessionContext.isUserAuthenticated(ctx));
      assert.ok(() => noAuthOptionsContext.isUserAuthenticated(ctx));
    });
  });

  describe("StoreContext useContext suite", () => {
    let sessionWithCtx;
    const sessionId = "A";

    before(() => {
      const ctx = createFrameworkCtx();
      ctx.getCookie = () => sessionId;
      ctx["session-id"] = sessionId;

      sessionWithCtx = new StoreContext<any>({ authentificationField: "mail" }).useContext(ctx);
    });

    it("should return the final key when init success", async() => {
      const key = randomValue();

      assert.equal(await sessionWithCtx.initSession(key, {}), key);
    });

    it("should set a cookie when initSession() has been call", async() => {
      const payload = { returnTo: "http://localhost/" };

      assert.equal(await sessionWithCtx.initSession(sessionId, payload), sessionId);
    });

    it("should return the session if available", async() => {
      const payload = { returnTo: "false" };

      await sessionWithCtx.initSession(sessionId, payload);

      assert.equal((await sessionWithCtx.getSession()).returnTo, false);
    });
  });

  // SessionStore SUITE via super()
  describe("Store Context SessionStore suite", () => {
    let sessionContext: StoreContext;

    before(() => {
      sessionContext = new StoreContext<any>({ authentificationField: "mail" });
    });

    it("should return the key for the stored value", async() => {
      const value = await sessionContext.setValue({ value: { mail: "value" } as Partial<Store> });

      assert.ok(value);
    });

    it("should delete the value for the according given key", async() => {
      await sessionContext.setValue({ key: "key", value: "value" as Partial<Store> });

      const nbDeletedValue = await sessionContext.deleteValue("key");

      assert.equal(nbDeletedValue, 1);
    });

    it("should not delete a non-existing existing key", async() => {
      const nbDeletedValue = await sessionContext.deleteValue("non-existing");

      assert.equal(nbDeletedValue, 0);
    });
  });
});
