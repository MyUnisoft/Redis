/* eslint-disable func-style */
// Import Node.js Dependencies
import EventEmitter from "node:events";
import assert from "node:assert/strict";
import { describe, before, after, test } from "node:test";

// Import Internal Dependencies
import {
  RedisAdapter
} from "../../src";
import { KVPeer } from "../../src/index";

describe("KVPeer", () => {
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
    await redisAdapter.close();
  });

  describe("Working with prefixed keys", () => {
    let kvPeer: KVPeer;

    // CONSTANTS
    const [key, value] = ["foo", "bar"];
    const prefix = "test_runner";
    const prefixedKey = `${prefix}-${key}`;

    before(() => {
      kvPeer = new KVPeer({
        prefix,
        adapter: redisAdapter
      });
    });

    test("should be well instantiated", () => {
      assert.ok(kvPeer instanceof KVPeer);
      assert.ok(kvPeer instanceof EventEmitter);
    });

    test(`Given a valid value
          WHEN calling setValue
          THEN it should return the final key`,
    async() => {
      const finalKey = await kvPeer.setValue({ key, value });
      assert.equal(finalKey, prefixedKey);
    });

    test(`Given a valid key
          WHEN calling getValue
          THEN it should return the associated value`,
    async() => {
      const relatedValue = await kvPeer.getValue(key);
      assert.equal(relatedValue, value);
    });

    test(`Given an valid key
          WHEN calling deleteValue
          THEN it should return the number of deleted entry (1)`,
    async() => {
      const deletedEntries = await kvPeer.deleteValue(key);

      assert.equal(deletedEntries, 1);
    });
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

    before(() => {
      kvPeer = new KVPeer({
        type: "object",
        adapter: redisAdapter
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

        await kvPeer.setValue({ key, value });
      });

      test(`GIVEN a valid key
            WHEN calling getValue
            THEN it should return a mapped object according to the mapValue fn`,
      async() => {
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

        await kvPeer.setValue({ key, value });
      });

      test(`GIVEN a valid key
            WHEN calling getValue
            THEN it should return a mapped object according to the mapValue fn`,
      async() => {
        const value = await kvPeer.getValue(key);

        assert.deepStrictEqual(value, { ...value, customData: { meta: "foo" } });
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

        await kvPeer.setValue({ key, value });
      });

      test(`GIVEN a valid key
            WHEN calling getValue
            THEN it should return a mapped object according to the mapValue fn`,
      async() => {
        const finalValue = await kvPeer.getValue(key);
        assert.equal(finalValue, `foo-${value}`);
      });
    });
  });
});
