// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, test } from "node:test";

// Import Internal Dependencies
import {
  Connection
} from "../src/index";

describe("getConnectionPerf", () => {
  let connection: Connection;

  before(async() => {
    connection = new Connection({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    });

    await connection.initialize();
  });

  test(`WHEN calling getConnectionPerf
        THEN it should return an object with isAlive as true`,
  async() => {
    const res = await connection.getConnectionPerf();

    assert.ok(res.isAlive);
    assert.ok(res.perf! > 0);
  });

  test(`WHEN calling getConnectionPerf
        after calling closeRedis
        THEN it should return an object with isAlive as false`,
  async() => {
    await connection.close();

    const { isAlive } = await connection.getConnectionPerf();

    assert.equal(isAlive, false);
  });
});
