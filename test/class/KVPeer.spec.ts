// Import Node.js Dependencies
import EventEmitter from "events";

// Import Internal Dependencies
import { initRedis, closeRedis, clearAllKeys } from "../../src";
import { randomValue } from "../fixtures/utils/randomValue";
import { KVPeer } from "../../src/index";

// Constants & variables
let kvPeer: KVPeer;

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT } as any);
  await clearAllKeys();
});

afterAll(async() => {
  await closeRedis();
});

// KVPeer Instance
describe("KVPeer instance suite", () => {
  it("should instantiate with differents options in constructor", () => {
    kvPeer = new KVPeer({ prefix: "prefix-" });
    expect(kvPeer).toBeInstanceOf(KVPeer);
    expect(kvPeer).toBeInstanceOf(EventEmitter);
  });
});

// setValue Test suite
describe("setValue() suite", () => {
  beforeEach(async() => {
    await clearAllKeys();
  });

  it("should correctly set a string for 'raw' type and return the inserted key name", () => {
    const prefix = "prefix";
    kvPeer = new KVPeer({ prefix });
    const key = randomValue();

    expect(kvPeer.setValue(randomValue(), key))
      .resolves.toBe(`${prefix}-${key}`);
  });

  it("should correctly set a string for 'raw' type and return the inserted key name WITHOUT PREFIX", () => {
    kvPeer = new KVPeer();
    const key = randomValue();

    expect(kvPeer.setValue(randomValue(), key))
      .resolves.toBe(key);
  });
});

// getValue Test suite
describe("getValue() suite", () => {
  beforeEach(async() => {
    await clearAllKeys();
  });

  // RAW TYPE GET VALUE
  it("should return a string value for RAW TYPE", async() => {
    kvPeer = new KVPeer({ prefix: "prefix-" });
    const value = randomValue();
    const key = randomValue();

    await kvPeer.setValue(value, key);

    expect(kvPeer.getValue(key))
      .resolves.toBe(value);
  });

  it("should return null for an non-existing key", () => {
    kvPeer = new KVPeer({ prefix: "prefix-" });
    const nonExistentKey = randomValue();

    expect(kvPeer.getValue(nonExistentKey))
      .resolves.toBeNull();
  });

  it("should return an object for RAW TYPE", async() => {
    kvPeer = new KVPeer({ prefix: "prefix-" });
    const entries = { property: randomValue() };
    const key = randomValue();

    await kvPeer.setValue(entries as any, key);

    expect(kvPeer.getValue(key))
      .resolves.toBe(JSON.stringify(entries));
  });

  // OBJECT TYPE GET VALUE
  it("should return a mapped object for OBJECT TYPE", async() => {
    kvPeer = new KVPeer({
      prefix: "prefix-",
      type: "object",
      mapValue(value) {
        value.mapped = true;

        return value;
      }
    });

    const key = randomValue();
    const entries = { property: randomValue() };
    await kvPeer.setValue(entries as any, key);

    expect(kvPeer.getValue(key))
      .resolves.toEqual({ ...entries, mapped: true });
  });

  it("should return null for a non existing key and for OBJECT TYPE", () => {
    kvPeer = new KVPeer({ prefix: "prefix-", type: "object" });
    const key = randomValue();

    expect(kvPeer.getValue(key))
      .resolves.toBeNull();
  });
});

// deleteValue Test suite
describe("deleteValue() suite", () => {
  beforeEach(async() => {
    await clearAllKeys();
  });

  it("should correctly delete a key and return 1", async() => {
    kvPeer = new KVPeer({ prefix: "prefix-" });
    const value = randomValue();
    const key = randomValue();

    await kvPeer.setValue(value, key);

    expect(kvPeer.deleteValue(key))
      .resolves.toBe(1);
  });

  it("should correctly return O for a non existing key", () => {
    kvPeer = new KVPeer({ prefix: "prefix-" });
    const nonExistentKey = randomValue();

    expect(kvPeer.deleteValue(nonExistentKey))
      .resolves.toBe(0);
  });
});
