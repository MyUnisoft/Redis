/* eslint-disable func-style */
// Import Node.js Dependencies
import EventEmitter from "node:events";
import assert from "node:assert/strict";
import { describe, before, after, test } from "node:test";

// Import Internal Dependencies
import {
  MemoryAdapter,
  RedisAdapter
} from "../../src";
import { KVPeer } from "../../src/index";

describe("KVPeer", () => {
  describe("RedisAdapter", () => {
    const redisAdapter = new RedisAdapter({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    });

    before(async() => {
      await redisAdapter.initialize();
      await redisAdapter.flushdb();
    });

    after(async() => {
      await redisAdapter.close(true);
    });

    describe("Working with object type", () => {
      let kvPeer: KVPeer;

      // CONSTANTS
      const [key, value] = ["foo", {
        my: [
          {
            data: [
              { is: "foo" },
              { so: "bar" }
            ]
          },
          {
            good: "foo"
          }
        ],
        foo: {
          is: "bar",
          not: {
            bar: {
              but: "bar",
              key: [
                {
                  is: {
                    maybe: "foo"
                  }
                }
              ]
            }
          }
        }
      }];

      before(async() => {
        kvPeer = new KVPeer({
          type: "object",
          adapter: redisAdapter
        });

        await redisAdapter.flushall();
      });

      test("should be well instantiated", () => {
        assert.ok(kvPeer instanceof KVPeer);
        assert.ok(kvPeer instanceof EventEmitter);
      });

      test(`Given a valid key
            WHEN calling getValue
            THEN it should return the associated value`,
      async() => {
        await kvPeer.setValue({ key, value });

        const relatedValue = await kvPeer.getValue(key);

        assert.deepStrictEqual(relatedValue, value);
      });
    });

    test("With prefix", async() => {
      const kvPeer = new KVPeer({
        type: "raw",
        adapter: redisAdapter,
        prefix: "super-prefix"
      });
      await kvPeer.setValue({ key: "super-key", value: "boo" });

      const valueWithNoPrefix = await redisAdapter.getValue("super-key", "raw");
      assert.strictEqual(valueWithNoPrefix, null);

      const valueWithPrefix = await redisAdapter.getValue("super-prefix-super-key", "raw");
      assert.strictEqual(valueWithPrefix, "boo");

      const valueFromKVPeer = await kvPeer.getValue("super-key");
      assert.strictEqual(valueFromKVPeer, "boo");
    });

    test("With prefix and prefixSeparator", async() => {
      const kvPeer = new KVPeer({
        type: "raw",
        adapter: redisAdapter,
        prefix: "super-prefix",
        prefixSeparator: ":::"
      });
      await kvPeer.setValue({ key: "super-key", value: "boo" });

      const valueWithNoPrefix = await redisAdapter.getValue("super-key", "raw");
      assert.strictEqual(valueWithNoPrefix, null);

      const valueWithPrefix = await redisAdapter.getValue("super-prefix:::super-key", "raw");
      assert.strictEqual(valueWithPrefix, "boo");

      const valueFromKVPeer = await kvPeer.getValue("super-key");
      assert.strictEqual(valueFromKVPeer, "boo");
    });
  });

  describe("MemoryAdapter", () => {
    let memoryAdapter: MemoryAdapter;

    before(() => {
      memoryAdapter = new MemoryAdapter();
    });

    describe("Working with object type", () => {
      let kvPeer: KVPeer;

      // CONSTANTS
      const [key, value] = ["foo", {
        my: [
          {
            data: [
              { is: "foo" },
              { so: "bar" }
            ]
          },
          {
            good: "foo"
          }
        ],
        foo: {
          is: "bar",
          not: {
            bar: {
              but: "bar",
              key: [
                {
                  is: {
                    maybe: "foo"
                  }
                }
              ]
            }
          }
        }
      }];

      before(async() => {
        kvPeer = new KVPeer({
          type: "object",
          adapter: memoryAdapter
        });
      });

      test("should be well instantiated", () => {
        assert.ok(kvPeer instanceof KVPeer);
        assert.ok(kvPeer instanceof EventEmitter);
      });

      test(`Given a valid key
            WHEN calling getValue
            THEN it should return the associated value`,
      async() => {
        await kvPeer.setValue({ key, value });

        const relatedValue = await kvPeer.getValue(key);

        assert.deepStrictEqual(relatedValue, value);
      });
    });
  });
});
