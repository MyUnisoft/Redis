// Import Internal Dependencies
import { initRedis, closeRedis, getConnectionPerf } from "../src/index";

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any);
});

describe("getConnectionPerf", () => {
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

afterAll(async() => {
  await closeRedis();
});
