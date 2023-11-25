// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, test } from "node:test";

// Import Internal Dependencies
import {
  initRedis,
  closeRedis,
  getConnectionPerf,
  closeAllRedis
} from "../src/index";

describe("getConnectionPerf", () => {
  before(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
  });

  test(`WHEN calling getConnectionPerf
        THEN it should return an object with isAlive as true`,
  async() => {
    const { isAlive, perf } = await getConnectionPerf();

    assert.ok(isAlive);
    assert.ok(perf! > 0);
  });

  test(`WHEN calling getConnectionPerf
        after calling closeRedis
        THEN it should return an object with isAlive as false`,
  async() => {
    await closeRedis();

    const { isAlive } = await getConnectionPerf();

    assert.equal(isAlive, false);
  });
});

describe("closeAllRedis", () => {
  before(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });

    await initRedis({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    }, "subscriber");
  });

  test("given multiple redis instance, it must close every connections", async() => {
    let perfs = await Promise.all([
      getConnectionPerf(),
      getConnectionPerf("subscriber")
    ]);

    for (const perf of perfs) {
      assert.equal(perf.isAlive, true);
    }

    await closeAllRedis();

    perfs = await Promise.all([
      getConnectionPerf(),
      getConnectionPerf("subscriber")
    ]);

    for (const perf of perfs) {
      assert.equal(perf.isAlive, false);
    }
  });
});
