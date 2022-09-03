// Import Node.js Dependencies
import EventEmitter from "events";

// Import Internal Dependencies
import {
  initRedis,
  closeRedis,
  clearAllKeys,
  StoreContext,
  SessionStore,
  Store
} from "../../../src";
import { randomValue } from "../../fixtures/utils/randomValue";

// Constants & variables
let sessionContext: StoreContext;
const kDefaultCookieOptions = { sameSite: "none", secure: true };

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT } as any);
  await clearAllKeys();
});

afterAll(async() => {
  await closeRedis();
});

// instace suite
describe("Store Context initialization's suite", () => {
  it("should be instance of EventEmitter & StoreContext", () => {
    sessionContext = new StoreContext<CustomStore>({
      authentificationField: "mail",
      sessionDuration: 3600,
      randomKeyCallback: () => "randomKey"
    });

    expect(sessionContext).toBeInstanceOf(StoreContext);
    expect(sessionContext).toBeInstanceOf(EventEmitter);
  });
});

function createFrameworkCtx() {
  return {
    getCookie: jest.fn(),
    setCookie: jest.fn()
  };
}

// initSession SUITE
describe("Store Context initSession suite", () => {
  beforeAll(() => {
    sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail", prefix: "store-context-" });
  });

  it("should throw an error if id is an empty string", async() => {
    expect.assertions(1);

    const ctx = createFrameworkCtx();
    const payload = { returnTo: "http://localhost/" };

    try {
      await sessionContext.initSession("", ctx, payload);
    }
    catch (error) {
      expect(error.message).toBe("id must not be an empty string");
    }
  });

  it("should return the final key when init success", async() => {
    const key = randomValue();
    const ctx = createFrameworkCtx();

    expect(await sessionContext.initSession(key, ctx, {})).toBe(key);
  });

  it("should set a cookie when initSession() has been call", async() => {
    const ctx = createFrameworkCtx();
    const payload = { returnTo: "http://localhost/" };
    const sessionId = "A";

    await sessionContext.initSession(sessionId, ctx, payload);

    expect(ctx.setCookie).toHaveBeenCalledTimes(1);
    expect(ctx.setCookie).toHaveBeenCalledWith("session-id", sessionId, kDefaultCookieOptions);
  });
});

// destroySession Suite
describe("Store Context destroySession suite", () => {
  beforeAll(() => {
    sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail" });
  });

  it("should throw error if there is no cookie `session-id`", async() => {
    expect.assertions(1);

    const ctx = createFrameworkCtx();

    try {
      await sessionContext.destroySession(ctx);
    }
    catch (error) {
      expect(error.message).toBe("Unable to found any cookie session-id. Your session is probably expired!");
    }
  });

  it("should correctly destroy session", async() => {
    const ctx = createFrameworkCtx();
    const payload = { returnTo: "http://localhost/" };
    const sessionId = "A";

    await sessionContext.initSession(sessionId, ctx, payload);
    ctx.getCookie.mockImplementation(jest.fn(() => sessionId));
    ctx["session-id"] = sessionId;
    await sessionContext.destroySession(ctx);

    expect(ctx.setCookie).toHaveBeenCalledTimes(2);
  });
});

// getSession SUITE
describe("Store Context getSession suite", () => {
  beforeAll(() => {
    sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail" });
  });

  it("should return the session if available", async() => {
    const ctx = createFrameworkCtx();
    const payload = { returnTo: "false" };
    const sessionId = "A";

    await sessionContext.initSession(sessionId, ctx, payload);
    ctx.getCookie.mockImplementation(jest.fn(() => sessionId));
    ctx["session-id"] = sessionId;

    expect(await sessionContext.getSession(ctx)).toHaveProperty("returnTo", "false");
  });
});


// isAuthenticated SUITE
describe("Store Context isUserAuthenticated suite", () => {
  beforeAll(() => {
    sessionContext = new StoreContext<CustomStore>({ authentificationField: "mail" });
  });

  it("should return false for an undefined `session-id` cookie", async() => {
    const ctx = createFrameworkCtx();

    expect(await sessionContext.isUserAuthenticated(ctx)).toBeFalsy();
  });

  it("should return false if there is no data stored for the `session-id` cookie", async() => {
    const ctx = createFrameworkCtx();

    sessionContext.initSession("non-null", ctx, {});
    ctx["session-id"] = "non-null";
    ctx.getCookie.mockImplementation(jest.fn(() => "session-id"));
    sessionContext.destroySession(ctx);

    expect(await sessionContext.isUserAuthenticated(ctx)).toBeFalsy();
  });

  it("should return true for a `session-id` cookie having data stored", async() => {
    const noAuthOptionsContext = new StoreContext();
    const ctx = createFrameworkCtx();

    await sessionContext.initSession("user", ctx, {});

    expect(() => sessionContext.isUserAuthenticated(ctx)).toBeTruthy();
    expect(() => noAuthOptionsContext.isUserAuthenticated(ctx)).toBeTruthy();
  });
});

describe("StoreContext useContext suite", () => {
  let sessionWithCtx;
  const sessionId = "A";

  beforeAll(() => {
    const ctx = createFrameworkCtx();
    ctx.getCookie.mockImplementation(jest.fn(() => sessionId));
    ctx["session-id"] = sessionId;

    sessionWithCtx = new StoreContext<any>({ authentificationField: "mail" }).useContext(ctx);
  });

  it("should return the final key when init success", async() => {
    const key = randomValue();

    expect(await sessionWithCtx.initSession(key, {})).toBe(key);
  });

  it("should set a cookie when initSession() has been call", async() => {
    const payload = { returnTo: "http://localhost/" };

    expect(await sessionWithCtx.initSession(sessionId, payload)).toBe(sessionId);
  });

  it("should return the session if available", async() => {
    const payload = { returnTo: "false" };

    await sessionWithCtx.initSession(sessionId, payload);

    expect(await sessionWithCtx.getSession()).toHaveProperty("returnTo", "false");
  });
});

// SessionStore SUITE via super()
describe("Store Context SessionStore suite", () => {
  beforeAll(() => {
    sessionContext = new StoreContext<any>({ authentificationField: "mail" });
  });

  it("should return the key for the stored value", async() => {
    const value = await sessionContext.setValue("value" as Partial<Store>);

    expect(value).toBeDefined();
  });

  it("should delete the value for the according given key", async() => {
    await sessionContext.setValue("value" as Partial<Store>, "key");

    const nbDeletedValue = await sessionContext.deleteValue("key");

    expect(nbDeletedValue).toBe(1);
  });

  it("should not delete a non-existing existing key", async() => {
    const nbDeletedValue = await sessionContext.deleteValue("non-existing");

    expect(nbDeletedValue).toBe(0);
  });
});

// type Definition
interface CustomStore extends Store {
  mail?: string;
}

