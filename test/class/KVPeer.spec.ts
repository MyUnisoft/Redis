// Import Node.js Dependencies
import EventEmitter from "events";

// Import Internal Dependencies
import {
  initRedis,
  closeRedis,
  clearAllKeys
} from "../../src";
import { KVPeer } from "../../src/index";

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any);
  await clearAllKeys();
});

afterAll(async() => {
  await closeRedis();
});

// KVPeer Instance
describe("KVPeer instance", () => {
  describe("Default instantiation", () => {
    let kvPeer: KVPeer;

    // CONSTANTS
    const [stringRelatedKey, stringValue] = ["foo", "bar"];
    const [objectRelatedKey, objectValue] = ["bar", { foo: "bar" }];
    const fakeKey = "my-fake-key";

    beforeAll(() => {
      kvPeer = new KVPeer();
    });

    it("should be well instantiated", () => {
      expect(kvPeer).toBeInstanceOf(KVPeer);
      expect(kvPeer).toBeInstanceOf(EventEmitter);
    });

    test(`Given a valid value
          WHEN calling setValue
          THEN it should return the initial key`,
    async() => {
      const finalStringRelatedKey = await kvPeer.setValue({ key: stringRelatedKey, value: stringValue });
      expect(finalStringRelatedKey).toBe(stringRelatedKey);

      const finalObjectRelatedKey = await kvPeer.setValue({ key: objectRelatedKey, value: objectValue });
      expect(finalObjectRelatedKey).toBe(objectRelatedKey);
    });

    test(`Given an invalid key
          WHEN calling getValue
          THEN it should return null`,
    async() => {
      const value = await kvPeer.getValue(fakeKey);
      expect(value).toBe(null);
    });

    test(`Given a valid key
          WHEN calling getValue
          THEN it should return the associated value`,
    async() => {
      const stringRelatedValue = await kvPeer.getValue(stringRelatedKey);
      expect(stringRelatedValue).toBe(stringValue);

      const objectRelatedValue = await kvPeer.getValue(objectRelatedKey);
      expect(objectRelatedValue).toBe(JSON.stringify(objectValue));
    });

    test(`Given an invalid key
          WHEN calling deleteValue
          THEN it should return 0`,
    async() => {
      const deletedEntries = await kvPeer.deleteValue(fakeKey);

      expect(deletedEntries).toBe(0);
    });

    test(`Given an valid key
          WHEN calling deleteValue
          THEN it should return the number of deleted entry (1)`,
    async() => {
      const deletedEntries = await kvPeer.deleteValue(stringRelatedKey);

      expect(deletedEntries).toBe(1);
    });
  });

  describe("Working with prefixed keys", () => {
    let kvPeer: KVPeer;

    // CONSTANTS
    const [key, value] = ["foo", "bar"];
    const prefix = "jest";
    const prefixedKey = `${prefix}-${key}`;

    beforeAll(() => {
      kvPeer = new KVPeer({
        prefix
      });
    });

    it("should be well instantiated", () => {
      expect(kvPeer).toBeInstanceOf(KVPeer);
      expect(kvPeer).toBeInstanceOf(EventEmitter);
    });

    test(`Given a valid value
          WHEN calling setValue
          THEN it should return the final key`,
    async() => {
      const finalKey = await kvPeer.setValue({ key, value });
      expect(finalKey).toBe(prefixedKey);
    });

    test(`Given a valid key
          WHEN calling getValue
          THEN it should return the associated value`,
    async() => {
      const relatedValue = await kvPeer.getValue(key);
      expect(relatedValue).toBe(value);
    });

    test(`Given an valid key
          WHEN calling deleteValue
          THEN it should return the number of deleted entry (1)`,
    async() => {
      const deletedEntries = await kvPeer.deleteValue(key);

      expect(deletedEntries).toBe(1);
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

    beforeAll(() => {
      kvPeer = new KVPeer({
        type: "object"
      });
    });

    it("should be well instantiated", () => {
      expect(kvPeer).toBeInstanceOf(KVPeer);
      expect(kvPeer).toBeInstanceOf(EventEmitter);
    });

    test(`Given a valid value
          WHEN calling setValue
          THEN it should return the final key`,
    async() => {
      const finalKey = await kvPeer.setValue({ key, value });
      expect(finalKey).toBe(key);
    });

    test(`Given a valid key
          WHEN calling getValue
          THEN it should return the associated value`,
    async() => {
      const relatedValue = await kvPeer.getValue(key);
      expect(relatedValue).toStrictEqual(value);
    });
  });

  describe("Working with mapValue", () => {
    describe("mapped object without predefined type", () => {
      let kvPeer: KVPeer<object>;

      // CONSTANTS
      const [key, value] = ["foo", {
        bar: [ { foo: "bar" }, { bar: "foo" } ]
      }];
      const mapValue = (value: object) => {
        value["mapped"] = true;

        return value;
      };

      beforeAll(async() => {
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
        expect(finalValue).toStrictEqual({ ...value, mapped: true });
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
        bar: [ { foo: "bar" }, { key: "value" } ]
      }];
      const mapValue = (value: MyCustomObject) => {
        const metadata: Metadata = {
            meta: "foo"
        };

        return Object.assign({}, value, { customData: metadata });
      }

      beforeAll(async() => {
        kvPeer = new KVPeer<MyCustomObject, Metadata>({
          type: "object",
          mapValue
        });

        await kvPeer.setValue({ key, value });
      })

      test(`GIVEN a valid key
            WHEN calling getValue
            THEN it should return a mapped object according to the mapValue fn`,
      async() => {
        const value = await kvPeer.getValue(key);

        expect(value).toEqual({ ...value, customData: { meta: "foo" }});
      });
    });

    describe("mapped string", () => {
      let kvPeer: KVPeer<string>;

      // CONSTANTS
      const [key, value] = ["foo", "bar"];
      const mapValue = (value: string) => {
        value = `foo-${value}`;

        return value;
      };

      beforeAll(async() => {
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
        expect(finalValue).toEqual(`foo-${value}`);
      });
    });
  });
});
