// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, it } from "node:test";
import timers from "node:timers/promises";

// Import Internal Dependencies
import {
  MemoryAdapter,
  RedisAdapter,
  TimedKVPeer
} from "../../src";

interface CustomStore {
  mail?: string;
}

describe("TimedKVPeer", () => {
  describe("RedisAdapter", () => {
    let redisAdapter: RedisAdapter;
    let timedKVPeer: TimedKVPeer<CustomStore>;

    before(async() => {
      redisAdapter = new RedisAdapter({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await redisAdapter.initialize();
      await redisAdapter.flushdb();

      timedKVPeer = new TimedKVPeer({
        adapter: redisAdapter,
        ttl: 3600
      });
    });

    after(async() => {
      await redisAdapter.close(true);
    });

    describe("SetValue", () => {
      it("should add the key value", async() => {
        const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

        assert.ok(key);
      });

      it("Given an expired key, it should return null", async() => {
        await timers.setTimeout(3_600);

        assert.equal(await timedKVPeer.getValue("foo"), null);
      });
    });

    describe("deleteValue", () => {
      it("Given a valid key", async() => {
        const result = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

        const deletedValues = await timedKVPeer.deleteValue(result.val as KeyType);

        assert.equal(deletedValues, 1);
      });

      it("Given a expired key", async() => {
        const result = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

        await timers.setTimeout(3_600);

        const deletedValues = await timedKVPeer.deleteValue(result.val as KeyType);

        assert.equal(deletedValues, 0);
      });
    });
  });

  describe("MemoryAdapter", () => {
    let memoryAdapter: MemoryAdapter;
    let timedKVPeer: TimedKVPeer<CustomStore>;

    before(async() => {
      memoryAdapter = new MemoryAdapter();

      timedKVPeer = new TimedKVPeer({
        adapter: memoryAdapter,
        ttl: 3600
      });
    });

    describe("SetValue", () => {
      it("should add the key value", async() => {
        const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

        assert.ok(key);
      });

      it("Given an expired key, it should return null", async() => {
        await timers.setTimeout(3_600);

        assert.equal(await timedKVPeer.getValue("foo"), null);
      });
    });

    describe("deleteValue", () => {
      it("Given a valid key", async() => {
        const result = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

        const deletedValues = await timedKVPeer.deleteValue(result.val as KeyType);

        assert.equal(deletedValues, 1);
      });

      it("Given a expired key", async() => {
        const result = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

        await timers.setTimeout(3_600);

        const deletedValues = await timedKVPeer.deleteValue(result.val as KeyType);

        assert.equal(deletedValues, 0);
      });
    });
  });
});
