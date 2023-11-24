// Import Internal Dependencies
import {
  initRedis,
  closeRedis,
  getConnectionPerf,
  closeAllRedis
} from "../src/index";

describe("getConnectionPerf", () => {
  beforeAll(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
  });

  test(`WHEN calling getConnectionPerf
        THEN it should return an object with isAlive as true`,
  async() => {
    const { isAlive, perf } = await getConnectionPerf();

    expect(isAlive).toBe(true);
    expect(perf).toBeGreaterThan(0);
  });

  test(`WHEN calling getConnectionPerf
        after calling closeRedis
        THEN it should return an object with isAlive as false`,
  async() => {
    await closeRedis();

    const { isAlive } = await getConnectionPerf();

    expect(isAlive).toBe(false);
  });
});

describe("closeAllRedis", () => {
  beforeAll(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });

    await initRedis({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    }, "subscriber");
  });

  test("given multiple redis instance, it must close every connections", async() => {
    expect.assertions(4);

    let perfs = await Promise.all([
      getConnectionPerf(),
      getConnectionPerf("subscriber")
    ]);

    for (const perf of perfs) {
      expect(perf.isAlive).toBe(true);
    }

    await closeAllRedis();

    perfs = await Promise.all([
      getConnectionPerf(),
      getConnectionPerf("subscriber")
    ]);

    for (const perf of perfs) {
      expect(perf.isAlive).toBe(false);
    }
  });
});
