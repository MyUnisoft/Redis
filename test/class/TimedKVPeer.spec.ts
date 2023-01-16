// Import Internal Dependencies
import {
  initRedis,
  closeRedis,
  clearAllKeys,
  TimedKVPeer
} from "../../src";

// CONSTANTS
let timedKVPeer: TimedKVPeer<CustomStore>;

interface CustomStore {
  mail?: string;
}

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any);
  await clearAllKeys();
});

afterAll(async() => {
  await closeRedis();
});

describe("TimedKVPeer", () => {
  beforeAll(async() => {
    timedKVPeer = new TimedKVPeer({
      ttl: 3600
    });
  });

  describe("SetValue", () => {
    it("should add the key value", async() => {
      const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

      expect(key).toBeDefined();
    });

    it("Given an expired key, it should return null", async() => {
      await new Promise((resolve) => setTimeout(resolve, 3600));

      expect(await timedKVPeer.getValue("key")).toBe(null);
    });
  });

  describe("deleteValue", () => {
    it("Given a valid key", async() => {
      const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

      const deletedValues = await timedKVPeer.deleteValue(key);

      expect(deletedValues).toBe(1);
    });

    it("Given a expired key", async () => {
      const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

      await new Promise((resolve) => setTimeout(resolve, 3600));

      const deletedValues = await timedKVPeer.deleteValue(key);

      expect(deletedValues).toBe(0);
    });
  });

});
