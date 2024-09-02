// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, it } from "node:test";
import timers from "node:timers/promises";

// Import Internal Dependencies
import {
  Connection,
  TimedKVPeer
} from "../../src";

interface CustomStore {
  mail?: string;
}

describe("TimedKVPeer", () => {
  let connection: Connection;
  let timedKVPeer: TimedKVPeer<CustomStore>;

  before(async() => {
    connection = new Connection({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    });

    await connection.initialize();
    await connection.flushdb();

    timedKVPeer = new TimedKVPeer({
      connection,
      ttl: 3600
    });
  });

  after(async() => {
    await connection.close();
  });

  describe("SetValue", () => {
    it("should add the key value", async() => {
      const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

      assert.ok(key);
    });

    it("Given an expired key, it should return null", async() => {
      await timers.setTimeout(3_600);

      assert.equal(await timedKVPeer.getValue("key"), null);
    });
  });

  describe("deleteValue", () => {
    it("Given a valid key", async() => {
      const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

      const deletedValues = await timedKVPeer.deleteValue(key);

      assert.equal(deletedValues, 1);
    });

    it("Given a expired key", async() => {
      const key = await timedKVPeer.setValue({ key: "foo", value: { mail: "bar" } });

      await timers.setTimeout(3_600);

      const deletedValues = await timedKVPeer.deleteValue(key);

      assert.equal(deletedValues, 0);
    });
  });
});
