// Import Node.js Dependencies
import timers from "node:timers/promises";

// Import Internal Dependencies
import {
  initRedis,
  closeAllRedis,
  clearAllKeys,
  TimedKVPeer
} from "../../src";

// CONSTANTS
let timedKVPeer: TimedKVPeer<CustomStore>;

interface CustomStore {
  mail?: string;
}

beforeAll(async() => {
  await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
  await clearAllKeys();
});

afterAll(async() => {
  await closeAllRedis();
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
      await timers.setTimeout(3_600);

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

      await timers.setTimeout(3_600);

      const deletedValues = await timedKVPeer.deleteValue(key);

      expect(deletedValues).toBe(0);
    });
  });

});
