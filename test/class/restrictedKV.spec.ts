// Import Node.js Dependencies
import { EventEmitter } from "events";

import { initRedis, closeRedis, clearAllKeys, RestrictedKV } from "../../src";
import { randomValue } from "../fixtures/utils/randomValue";

// Constants & variables
let restrictedKV: RestrictedKV;

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT } as any);
  await clearAllKeys();
});

afterAll(async() => {
  await closeRedis();
});

describe("class instance suite", () => {
  it("should be instantiated", () => {
    restrictedKV = new RestrictedKV({ prefix: "auth-" });
    expect(restrictedKV).toBeInstanceOf(RestrictedKV);
    expect(restrictedKV).toBeInstanceOf(EventEmitter);
  });

  it("should return a default payload with getDefaultAttempt() static method", () => {
    const defaultAttempt = RestrictedKV.getDefaultAttempt();
    expect(defaultAttempt).toMatchObject({
      failure: 0,
      locked: false
    });
    expect(typeof defaultAttempt.lastTry).toStrictEqual("number");
  });
});

describe("getRestrictedKV suite", () => {
  const lastTry = Date.now();
  const payload = { failure: 0, lastTry, locked: false };

  beforeAll(() => {
    restrictedKV = new RestrictedKV({ prefix: "auth-" });
  });

  beforeEach(async() => {
    await clearAllKeys();
  });

  it("should  return an Attempt Object in normal configuration", async() => {
    const key = randomValue();

    await restrictedKV.setValue(payload, key);
    await expect(restrictedKV.getAttempt(key)).resolves.toEqual(payload);
  });

  it("should return an attempt object if failure property is not present", async() => {
    const emptyPayloadOne = { locked: false };
    const key = randomValue();

    await restrictedKV.setValue(emptyPayloadOne, key);
    await expect(restrictedKV.getAttempt(key))
      .resolves.toEqual({ failure: 0, lastTry: Date.now(), locked: false });
  });

  it("should return an attempt object if only failure property is present", async() => {
    const emptyPayloadTwo = { failure: 0 };
    const key = randomValue();

    await restrictedKV.setValue(emptyPayloadTwo, key);
    await expect(restrictedKV.getAttempt(key))
      .resolves.toEqual({ failure: 0, lastTry: Date.now(), locked: false });
  });
});

describe("failure suite", () => {
  beforeAll(() => {
    restrictedKV = new RestrictedKV({ prefix: "auth-" });
  });

  beforeEach(async() => {
    await clearAllKeys();
  });

  it("should return an Attempt object with failure = 2", async() => {
    const lastTry = Date.now();
    const payload = { failure: 1, lastTry, locked: false };
    const key = randomValue();

    await restrictedKV.setValue(payload, key);
    await expect(restrictedKV.fail(key)).resolves.toHaveProperty("failure", 2);
  });

  it("should return an Attempt object with locked = true", async() => {
    const lastTry = Date.now();
    const payload = { failure: 7, lastTry, locked: false };
    const key = randomValue();

    await restrictedKV.setValue(payload, key);

    expect(restrictedKV.fail(key))
      .resolves.toHaveProperty("locked", true);
  });

  it("should return an attempt with non-existing-key",
    () => expect(restrictedKV.fail("nonExistentKey")).resolves.toHaveProperty("failure"));

  it("should not increment failure if ban time in second is expired", async() => {
    const lastTry = Date.now() - (60 * 1000 * 60 * 24);
    const payload = { failure: 1, lastTry, locked: false };
    const key = randomValue();

    await restrictedKV.setValue(payload, key);

    expect(restrictedKV.fail(key))
      .resolves.toHaveProperty("failure", 1);
  });
});

describe("success suite", () => {
  beforeAll(() => {
    restrictedKV = new RestrictedKV({ prefix: "auth-" });
  });

  beforeEach(async() => {
    await clearAllKeys();
  });

  it("should return default payload for a non-existing key", async() => {
    const nonExistentKey = randomValue();

    await restrictedKV.success(nonExistentKey);
    await expect(restrictedKV.getAttempt(nonExistentKey)).resolves.toMatchObject({
      failure: 0,
      locked: false
    });
  });

  it("should return default payload after the key is correctly deleted on success", async() => {
    const lastTry = Date.now();
    const payload = { failure: 10, lastTry, locked: true };
    const key = randomValue();

    await restrictedKV.setValue(payload, key);
    await restrictedKV.success(key);

    await expect(restrictedKV.getAttempt(key)).resolves.toMatchObject({
      failure: 0,
      locked: false
    });
  });
});

describe("clearExpired database suite", () => {
  beforeAll(() => {
    restrictedKV = new RestrictedKV({ prefix: "auth-" });
  });

  beforeEach(async() => {
    await clearAllKeys();
  });

  it("should not clean not expired key from database", async() => {
    const notExpiredPayload = { failure: 0, lastTry: Date.now(), locked: false };
    const key = randomValue();

    await restrictedKV.setValue(notExpiredPayload, key);
    await restrictedKV.clearExpired();

    expect(restrictedKV.getAttempt(key)).resolves.toEqual(notExpiredPayload);
  });

  it("should clear all keys from the database when invoked", async() => {
    const lastTry = Date.now() - (90 * 1_000 * 60);
    const payload = { failure: 3, lastTry, locked: true };
    const key = randomValue();

    await restrictedKV.setValue(payload, key);
    await restrictedKV.clearExpired();

    expect(restrictedKV.getAttempt(key)).resolves.toMatchObject({
      failure: 0,
      locked: false
    });
  });

  it("should emit an event when method is invoked", async() => {
    const lastTry = Date.now() - (90 * 1_000 * 60);
    const payload = { failure: 3, lastTry, locked: false };
    const key = randomValue();

    const expiredKeys = jest.fn();
    const eventEmitter = new EventEmitter();

    eventEmitter.on("expiredKeys", expiredKeys);
    restrictedKV.on("expiredKeys", expiredKeys);

    await restrictedKV.setValue(payload, key);
    await restrictedKV.clearExpired();

    expect(expiredKeys).toHaveBeenCalled();
  });

  it("should return undefined if there is no stored keys that start with the 'auth-' prefix", async() => {
    await expect(restrictedKV.clearExpired()).resolves.toBeUndefined();
  });
});

describe("autoClearInterval database suite", () => {
  beforeAll(() => {
    restrictedKV = new RestrictedKV({ prefix: "auth-", autoClearExpired: 3000 });
  });

  beforeEach(async() => {
    await clearAllKeys();
  });

  afterAll(() => {
    restrictedKV.clearAutoClearInterval();
  });

  it("should clear all keys from the database when invoked", async() => {
    const lastTry = Date.now() - (90 * 1_000 * 60);
    const payload = { failure: 3, lastTry, locked: true };
    const key = randomValue();

    await restrictedKV.setValue(payload, key);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    expect(restrictedKV.getAttempt(key)).resolves.toMatchObject({
      failure: 0,
      locked: false
    });
  });
});
