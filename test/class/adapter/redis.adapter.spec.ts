// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, after, it, test } from "node:test";

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

    after(async() => {
      await redisAdapter?.close(true);

      redisAdapter.removeAllListeners();
    });

    it("Should be well instantiated", async() => {
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
        await redisAdapter.close(true);

        redisAdapter.removeAllListeners();
      });

      it("should return `true`", async() => {
        const isAlive = await redisAdapter.isAlive();

        assert.equal(isAlive, true);
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
          await redisAdapter.close(true);
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
          await redisAdapter.close(true);
        });

        it("should return `isAlive` at `false` & perf as a `number`", async() => {
          const { isAlive, perf } = await redisAdapter.getPerformance();

          assert.equal(isAlive, false);
          assert.ok(perf);
        });
      });
    });
  });

  describe("setValue", () => {
    describe("Working with object type", () => {
      let redisAdapter: RedisAdapter;

      before(async() => {
        redisAdapter = new RedisAdapter({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });

        await redisAdapter.initialize();
        await redisAdapter.flushdb();
      });

      after(async() => {
        await redisAdapter.close(true);
      });

      test("Given a buffer, then it should store a buffer", async() => {
        const customKey = "nested-buffer";
        const value = {
          foo: {
            buffer: Buffer.from("string")
          }
        };

        const finalKey = await redisAdapter.setValue({
          key: customKey,
          value,
          type: "object",
          prefix: ""
        });

        assert.equal(finalKey, customKey);
        const finalValue = await redisAdapter.getValue(customKey, "", "object");
        // eslint-disable-next-line dot-notation
        assert.equal(finalValue!["foo"]["buffer"].toString(), value.foo.buffer.toString());
      });
    });

    describe("Working with raw type", () => {
      let redisAdapter: RedisAdapter;

      const [firstKey, secondKey] = ["foo", "bar"];

      before(async() => {
        redisAdapter = new RedisAdapter({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });

        await redisAdapter.initialize();
        await redisAdapter.flushdb();
      });

      after(async() => {
        await redisAdapter.close(true);
      });

      test("Given a valid value, it should return the initial key", async() => {
        const firstResultedKey = await redisAdapter.setValue<string>({
          key: firstKey,
          value: "bar",
          type: "raw",
          prefix: ""
        });

        assert.equal(firstKey, firstResultedKey);

        const secondResultedKey = await redisAdapter.setValue({
          key: secondKey,
          value: {
            foo: "bar"
          },
          type: "raw",
          prefix: ""
        });

        assert.equal(secondKey, secondResultedKey);
      });
    });
  });

  describe("getValue", () => {
    let redisAdapter: RedisAdapter;

    const [firstKey, firstValue] = ["key", "value"];
    const [secondKey, secondValue] = ["secondKey", {
      foo: "bar"
    }];

    before(async() => {
      redisAdapter = new RedisAdapter({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await redisAdapter.initialize();

      await redisAdapter.flushdb();

      await Promise.all([
        redisAdapter.setValue<string>({
          key: firstKey,
          value: firstValue,
          type: "raw",
          prefix: ""
        }),
        redisAdapter.setValue({
          key: secondKey,
          value: secondValue,
          type: "object",
          prefix: ""
        })
      ]);
    });

    after(async() => {
      await redisAdapter.close(true);
    });

    test("Given a valid key, it should return the associated value", async() => {
      const firstResultedValue = await redisAdapter.getValue(firstKey, "", "raw");
      assert.equal(firstValue, firstResultedValue);

      const secondResultedValue = await redisAdapter.getValue(secondKey, "", "object");
      assert.deepEqual(secondValue, secondResultedValue);
    });

    test("Given an invalid key, it should return null", async() => {
      const val = await redisAdapter.getValue("fake-key", "", "object");
      assert.equal(val, null);
    });
  });

  describe("deleteValue", () => {
    let redisAdapter: RedisAdapter;

    const key = "key";

    before(async() => {
      redisAdapter = new RedisAdapter({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await redisAdapter.initialize();

      await redisAdapter.flushdb();

      await redisAdapter.setValue<string>({
        key,
        value: "bar",
        type: "object",
        prefix: ""
      });
    });

    after(async() => {
      await redisAdapter.close(true);
    });

    test("Given an invalid key, then it should return 0", async() => {
      const deletedEntries = await redisAdapter.deleteValue("fake-key", "");

      assert.equal(deletedEntries, 0);
    });

    test("Given a valid key, then it should return 1", async() => {
      const deletedEntries = await redisAdapter.deleteValue(key, "");

      assert.equal(deletedEntries, 1);
    });
  });
});