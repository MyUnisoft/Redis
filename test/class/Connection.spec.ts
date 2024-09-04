// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, after, test } from "node:test";

// Import Internal Dependencies
import {
  Connection
} from "../../src";

describe("Connection", () => {
  describe("Default instantiation", () => {
    test("Should be well instantiated", async() => {
      const connection = new Connection({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await connection.close();
    });

    test("Calling Initialize, it should set the ready property at true", async() => {
      const connection = new Connection({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      const res = await connection.initialize();

      assert.equal(res.ok, true);

      await connection.close();
    });

    test("Calling getConnectionPerf while connection is init", async() => {
      const connection = new Connection({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await connection.initialize();

      const res = await connection.getConnectionPerf();

      assert.equal(res.isAlive, true);
      assert.ok(res.perf! > 0);

      await connection.close();
    });
  });
});
