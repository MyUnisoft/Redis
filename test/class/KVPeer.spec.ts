/* eslint-disable func-style */
// Import Node.js Dependencies
import EventEmitter from "node:events";
import assert from "node:assert/strict";
import { describe, before, after, test } from "node:test";

// Import Internal Dependencies
import {
  initRedis,
  clearAllKeys,
  closeAllRedis
} from "../../src";
import { KVPeer } from "../../src/index";


// KVPeer Instance
describe("KVPeer instance", () => {
  before(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
    await clearAllKeys();
  });

  after(async() => {
    await closeAllRedis();
  });

  describe("Default instantiation", () => {
    let kvPeer: KVPeer;

    // CONSTANTS
    const [stringRelatedKey, stringValue] = ["foo", "bar"];
    const [objectRelatedKey, objectValue] = ["bar", { foo: "bar" }];
    const fakeKey = "my-fake-key";

    before(() => {
      kvPeer = new KVPeer();
    });

    test("should be well instantiated", () => {
      assert.ok(kvPeer instanceof KVPeer);
      assert.ok(kvPeer instanceof EventEmitter);
    });

    test(`Given a valid value
          WHEN calling setValue
          THEN it should return the initial key`,
    async() => {
      const finalStringRelatedKey = await kvPeer.setValue({ key: stringRelatedKey, value: stringValue });
      assert.equal(finalStringRelatedKey, stringRelatedKey);

      const finalObjectRelatedKey = await kvPeer.setValue({ key: objectRelatedKey, value: objectValue });
      assert.equal(finalObjectRelatedKey, objectRelatedKey);
    });

    test(`Given an invalid key
          WHEN calling getValue
          THEN it should return null`,
    async() => {
      const value = await kvPeer.getValue(fakeKey);
      assert.equal(value, null);
    });

    test(`Given a valid key
          WHEN calling getValue
          THEN it should return the associated value`,
    async() => {
      const stringRelatedValue = await kvPeer.getValue(stringRelatedKey);
      assert.equal(stringRelatedValue, stringValue);

      const objectRelatedValue = await kvPeer.getValue(objectRelatedKey);
      assert.equal(objectRelatedValue, JSON.stringify(objectValue));
    });

    test(`Given an invalid key
          WHEN calling deleteValue
          THEN it should return 0`,
    async() => {
      const deletedEntries = await kvPeer.deleteValue(fakeKey);

      assert.equal(deletedEntries, 0);
    });

    test(`Given an valid key
          WHEN calling deleteValue
          THEN it should return the number of deleted entry (1)`,
    async() => {
      const deletedEntries = await kvPeer.deleteValue(stringRelatedKey);

      assert.equal(deletedEntries, 1);
    });
  });

  describe("Working with prefixed keys", () => {
    let kvPeer: KVPeer;

    // CONSTANTS
    const [key, value] = ["foo", "bar"];
    const prefix = "test_runner";
    const prefixedKey = `${prefix}-${key}`;

    before(() => {
      kvPeer = new KVPeer({
        prefix
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
      bar: [
        {
          foo: [
            { bar: "foo" },
            { foo: "bar" }
          ]
        },
        {
          bar: "foo"
        }
      ]
    }];

    before(() => {
      kvPeer = new KVPeer({
        type: "object"
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
      assert.equal(finalKey, key);
    });

    test(`Given a buffer
          WHEN calling setValue
          THEN it store a buffer`,
    async() => {
      const customKey = "nested-buffer";
      const value = {
        foo: {
          buffer: Buffer.from("string")
        }
      };

      const finalKey = await kvPeer.setValue({ key: customKey, value });
      assert.equal(finalKey, customKey);
      const finalValue = await kvPeer.getValue(customKey);
      // eslint-disable-next-line dot-notation
      assert.equal(finalValue!["foo"]["buffer"].toString(), value.foo.buffer.toString());
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
      let kvPeer: KVPeer<object>;

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
          mapValue
        });

        await kvPeer.setValue({ key, value });
      });

      test(`GIVEN a valid key
            WHEN calling getValue
            THEN it should return a mapped object according to the mapValue fn`,
      async() => {
        const finalValue = await kvPeer.getValue(key);
        assert.deepStrictEqual(finalValue, {
          bar: [
            {},
            { bar: null },
            { foo: "string" }
          ],
          mapped: true
        });
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
          mapValue
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
          mapValue
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
