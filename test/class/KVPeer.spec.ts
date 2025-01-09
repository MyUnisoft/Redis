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

    describe("Working with mapValue", () => {
      describe("mapped object without predefined type", () => {
        let kvPeer: KVPeer<any>;

        // CONSTANTS
        const [key, value] = ["foo", {
          bar: [
            { foo: undefined }, { bar: null }, { foo: "string" }
          ]
        }];
        const mapValue = (value: object) => {
          // eslint-disable-next-line dot-notation
          value["mapped"] = true;

          return value;
        };

        before(async() => {
          kvPeer = new KVPeer({
            type: "object",
            mapValue,
            adapter: redisAdapter
          });

          await redisAdapter.flushall();
        });

        test(`GIVEN a valid key
              WHEN calling getValue
              THEN it should return a mapped object according to the mapValue fn`,
        async() => {
          await kvPeer.setValue({ key, value });

          const finalValue = await kvPeer.getValue(key);

          assert.ok(finalValue!.mapped);
        });
      });

      describe("mapped object with predefined type for additional values", () => {
        interface MyCustomObject {
          bar: Record<string, any>[];
        }

        interface Metadata {
          meta: string;
        }

        let kvPeer: KVPeer<MyCustomObject, Metadata>;

        // CONSTANTS
        const [key, value] = ["foo", {
          bar: [
            { foo: "bar" }, { key: "value" }
          ]
        }];
        const mapValue = (value: MyCustomObject) => {
          const metadata: Metadata = {
            meta: "foo"
          };

          return Object.assign({}, value, { customData: metadata });
        };

        before(async() => {
          kvPeer = new KVPeer<MyCustomObject, Metadata>({
            type: "object",
            mapValue,
            adapter: redisAdapter
          });

          await redisAdapter.flushall();
        });

        test(`GIVEN a valid key
              WHEN calling getValue
              THEN it should return a mapped object according to the mapValue fn`,
        async() => {
          await kvPeer.setValue({ key, value });

          const result = await kvPeer.getValue(key);

          assert.deepStrictEqual(result, { ...value, customData: { meta: "foo" } });
        });
      });

      describe("mapped string", () => {
        let kvPeer: KVPeer<string>;

        // CONSTANTS
        const [key, value] = ["foo", "bar"];
        const mapValue = (value: string) => {
          const formatted = `foo-${value}`;

          return formatted;
        };

        before(async() => {
          kvPeer = new KVPeer({
            type: "raw",
            mapValue,
            adapter: redisAdapter
          });

          await redisAdapter.flushall();
        });

        test(`GIVEN a valid key
              WHEN calling getValue
              THEN it should return a mapped object according to the mapValue fn`,
        async() => {
          await kvPeer.setValue({ key, value });
          const finalValue = await kvPeer.getValue(key);
          assert.equal(finalValue, `foo-${value}`);
        });
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

    describe("Working with mapValue", () => {
      describe("mapped object without predefined type", () => {
        let kvPeer: KVPeer<any>;

        // CONSTANTS
        const [key, value] = ["foo", {
          bar: [
            { foo: undefined }, { bar: null }, { foo: "string" }
          ]
        }];
        const mapValue = (value: object) => {
          // eslint-disable-next-line dot-notation
          value["mapped"] = true;

          return value;
        };

        before(async() => {
          kvPeer = new KVPeer({
            type: "object",
            mapValue,
            adapter: memoryAdapter
          });

          memoryAdapter.flushall();
        });

        test(`GIVEN a valid key
              WHEN calling getValue
              THEN it should return a mapped object according to the mapValue fn`,
        async() => {
          await kvPeer.setValue({ key, value });

          const finalValue = await kvPeer.getValue(key);

          assert.ok(finalValue!.mapped);
        });
      });

      describe("mapped object with predefined type for additional values", () => {
        interface MyCustomObject {
          bar: Record<string, any>[];
        }

        interface Metadata {
          meta: string;
        }

        let kvPeer: KVPeer<MyCustomObject, Metadata>;

        // CONSTANTS
        const [key, value] = ["foo", {
          bar: [
            { foo: "bar" }, { key: "value" }
          ]
        }];
        const mapValue = (value: MyCustomObject) => {
          const metadata: Metadata = {
            meta: "foo"
          };

          return Object.assign({}, value, { customData: metadata });
        };

        before(async() => {
          kvPeer = new KVPeer<MyCustomObject, Metadata>({
            type: "object",
            mapValue,
            adapter: memoryAdapter
          });

          memoryAdapter.flushall();
        });

        test(`GIVEN a valid key
              WHEN calling getValue
              THEN it should return a mapped object according to the mapValue fn`,
        async() => {
          await kvPeer.setValue({ key, value });

          const result = await kvPeer.getValue(key);

          assert.deepStrictEqual(result, { ...value, customData: { meta: "foo" } });
        });
      });

      describe("mapped string", () => {
        let kvPeer: KVPeer<string>;

        // CONSTANTS
        const [key, value] = ["foo", "bar"];
        const mapValue = (value: string) => {
          const formatted = `foo-${value}`;

          return formatted;
        };

        before(async() => {
          kvPeer = new KVPeer({
            type: "raw",
            mapValue,
            adapter: memoryAdapter
          });

          await memoryAdapter.flushall();
        });

        test(`GIVEN a valid key
              WHEN calling getValue
              THEN it should return a mapped object according to the mapValue fn`,
        async() => {
          await kvPeer.setValue({ key, value });
          const finalValue = await kvPeer.getValue(key);
          assert.equal(finalValue, `foo-${value}`);
        });
      });
    });
  });
});
