// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, after, test } from "node:test";

// Import Internal Dependencies
import {
  Connection
} from "../../src";

describe("Connection", () => {
  describe("Without options", () => {
    let connection: Connection;

    before(async() => {
      connection = new Connection();
    });

    after(async() => {
      await connection.close();
    });

    test("Should be well instantiated", () => {
      assert.equal(connection.isAlive, false);
    });

    test("Calling Initialize, it should set the ready property at true", async() => {
      const res = await connection.initialize();

      assert.equal(res.ok, true);
      assert.equal(connection.isAlive, true);
    });

    test("Calling getConnectionPerf while connection is init", async() => {
      const res = await connection.getConnectionPerf();

      assert.equal(res.isAlive, true);
      assert.ok(res.perf! > 0);
    });
  });
});
