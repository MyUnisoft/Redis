// Import Internal Dependencies
import { initRedis, closeRedis, clearAllKeys, SessionStore } from "../../../src";

// Constants & variables
let sessionStore: SessionStore<CustomStore>;

beforeAll(async() => {
  await initRedis({ port: 6379 } as any);
  await clearAllKeys();
});

afterAll(async() => {
  await closeRedis();
});

describe("SessionStore", () => {
  beforeAll(async() => {
    sessionStore = new SessionStore({
      sessionDuration: 3600
    });
  });

  it("should add the key value", async() => {
    const key = await sessionStore.setValue("value" as Partial<CustomStore>, "key");

    expect(key).toBeDefined();
  });

  it("should not return the value", async() => {
    await new Promise((resolve) => setTimeout(resolve, 3600));

    expect(await sessionStore.getValue("key")).toBe(null);
  });
});

interface CustomStore {
  mail?: string;
}
