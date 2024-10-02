// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, after, it } from "node:test";

// Import Internal Dependencies
import { RedisAdapter } from "../../../src/class/adapter/redis.adapter";

describe("RedisAdapter", () => {
  describe("Default instantiation", () => {
    let redisAdapter: RedisAdapter;

    before(async() => {
      redisAdapter = new RedisAdapter({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });
    });

    it("Should be well instantiated", () => {
      assert.ok(redisAdapter instanceof RedisAdapter);
    });
  });

  describe("isAlive", () => {
    describe("While adapter is initialized", () => {
      let redisAdapter: RedisAdapter;

      before(async() => {
        redisAdapter = new RedisAdapter({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });

        await redisAdapter.initialize();
      });

      after(async() => {
        await redisAdapter.close();
      });

      it("should return `true`", async() => {
        const isAlive = await redisAdapter.isAlive();

        assert.equal(isAlive, true);
      });
    });

    describe("While adapter isn't initialized", () => {
      let redisAdapter: RedisAdapter;

      before(async() => {
        redisAdapter = new RedisAdapter({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });
      });

      it("should return `false`", async() => {
        const isAlive = await redisAdapter.isAlive();

        assert.equal(isAlive, false);
      });
    });
  });

  describe("getPerformance", () => {
    describe("While adapter is initialized", () => {
      describe("While connection is active", () => {
        let redisAdapter: RedisAdapter;

        before(async() => {
          redisAdapter = new RedisAdapter({
            port: Number(process.env.REDIS_PORT),
            host: process.env.REDIS_HOST
          });

          await redisAdapter.initialize();
        });

        after(async() => {
          await redisAdapter.close();
        });

        it("should return `isAlive` at `true` & perf as a `number`", async() => {
          const { isAlive, perf } = await redisAdapter.getPerformance();

          assert.equal(isAlive, true);
          assert.ok(perf);
        });
      });

      describe("While connection isn't active", () => {
        let redisAdapter: RedisAdapter;

        before(async() => {
          redisAdapter = new RedisAdapter({
            port: Number(process.env.REDIS_PORT),
            host: process.env.REDIS_HOST
          });

          await redisAdapter.initialize();
          await redisAdapter.close();
        });

        it("should return `isAlive` at `false` & perf as a `number`", async() => {
          const { isAlive, perf } = await redisAdapter.getPerformance();

          assert.equal(isAlive, false);
          assert.ok(perf);
        });
      });
    });

    describe("While adapter isn't initialized", () => {
      let redisAdapter: RedisAdapter;

      before(async() => {
        redisAdapter = new RedisAdapter({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });
      });

      it("should return `isAlive` at `false` & perf as a `number`", async() => {
        const { isAlive, perf } = await redisAdapter.getPerformance();

        assert.equal(isAlive, false);
        assert.ok(perf);
      });
    });
  });
});
