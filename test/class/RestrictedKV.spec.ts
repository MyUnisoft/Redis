// Import Node.js Dependencies
import timers from "node:timers/promises";
import { EventEmitter } from "node:events";

// Import Internal Dependencies
import { initRedis, clearAllKeys, RestrictedKV, closeAllRedis } from "../../src";
import { randomValue } from "../fixtures/utils/randomValue";

// Internal Dependencies Mock
const mockedDeleteValue = jest.spyOn(RestrictedKV.prototype as any, "deleteValue");
const doNothing = jest.fn();

beforeAll(async() => {
  await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
  await clearAllKeys();
});

afterAll(async() => {
  await closeAllRedis();
});

describe("RestrictedKV", () => {
  describe("Instantiated with default options", () => {
    let restrictedKV: RestrictedKV;

    beforeAll(() => {
      restrictedKV = new RestrictedKV();
    });

    it("should be instantiated", () => {
      expect(restrictedKV).toBeInstanceOf(RestrictedKV);
      expect(restrictedKV).toBeInstanceOf(EventEmitter);
    });

    test(`WHEN calling getDefaultAttempt
          THEN it should return a default default attempt object`, () => {
      const defaultAttempt = RestrictedKV.getDefaultAttempt();
      expect(defaultAttempt).toMatchObject({
        failure: 0,
        locked: false
      });
      expect(typeof defaultAttempt.lastTry).toStrictEqual("number");
    });

    describe("getAttempt", () => {
      const lastTry = Date.now();

      test(`Given an Attempt object with all keys
            WHEN calling getAttempt
            THEN it should return the initial object`,
      async() => {
        const key = randomValue();
        const payload = { failure: 0, lastTry, locked: false };

        await restrictedKV.setValue({ key, value: payload });
        await expect(restrictedKV.getAttempt(key)).resolves.toEqual(payload);
      });

      test(`Given a partial of Attempt object
            WHEN calling getAttempt
            THEN it should return a completed Attempt object`,
      async() => {
        const optionsWithLocked = {
          key: randomValue(),
          value: { locked: false }
        }

        await restrictedKV.setValue(optionsWithLocked);
        const attemptWithLocked = await restrictedKV.getAttempt(optionsWithLocked.key);
        expect(attemptWithLocked).toEqual(expect.objectContaining(Object.assign({},
          { lastTry: Date.now(), failure: 0 },
          optionsWithLocked.value
        )));

        const optionsWithFailure = {
          key: randomValue(),
          value: { failure: 0 }
        };

        await restrictedKV.setValue(optionsWithFailure);
        const attemptWithFailure = await restrictedKV.getAttempt(optionsWithFailure.key);
        expect(attemptWithFailure).toEqual(expect.objectContaining(Object.assign({},
          { lastTry: Date.now(), locked: false },
          optionsWithFailure.value
        )));
      });
    });

    describe("fail", () => {
      test(`Given a fake key
            WHEN calling fail
            THEN it should return a new Attempt object with failure property init at 1`,
      async() => {
        const attempt = await restrictedKV.fail("my-fake-key");
        expect(attempt).toHaveProperty("failure", 1);
      });

      test(`Given a valid key
            WHEN calling fail
            THEN it should return the associated Attempt object with failure property incremented`,
      async() => {
        const lastTry = Date.now();
        const payload = { failure: 1, lastTry, locked: false };
        const key = randomValue();

        await restrictedKV.setValue({ key, value: payload });

        const attempt = await restrictedKV.fail(key);
        expect(attempt).toHaveProperty("failure", payload.failure + 1);
      });
    });

    describe("success", () => {
      test(`GIVEN an unknown key
            WHEN calling success
            THEN it should return a clean Attempt object`,
      async() => {
        const key = randomValue();

        await restrictedKV.success(key);

        const attempt = await restrictedKV.getAttempt(key);
        expect(attempt).toMatchObject({
          failure: 0,
          locked: false
        });
      });

      test(`GIVEN a known key
            WHEN calling success
            THEN it should deleted the KVPeer`,
      async() => {
        const lastTry = Date.now();
        const payload = { failure: 0, lastTry, locked: true };
        const key = randomValue();

        await restrictedKV.setValue({ key, value: payload });
        await restrictedKV.success(key);

        expect(mockedDeleteValue).toHaveBeenCalled();
      });
    });

    describe("clearExpired", () => {
      test("should not clean not expired key from database", async() => {
        const payload = { failure: 0, lastTry: Date.now(), locked: false };
        const key = randomValue();

        await restrictedKV.setValue({ key, value: payload });
        await restrictedKV.clearExpired();

        expect(restrictedKV.getAttempt(key)).resolves.toEqual(payload);
      });

      test("should clear all keys from the database when invoked", async() => {
        const lastTry = Date.now() - (90 * 1_000 * 60);
        const payload = { failure: 3, lastTry, locked: true };
        const key = randomValue();

        await restrictedKV.setValue({ key, value: payload });
        await restrictedKV.clearExpired();

        const attempt = await restrictedKV.getAttempt(key);
        expect(attempt).toEqual(expect.objectContaining({
          failure: 0,
          locked: false
        }));
      });

      describe("expiredKeys event", () => {
        beforeAll(() => {
          restrictedKV.on("expiredKeys", doNothing);
        });

        test("should not send an event when no cleared key", async() => {
          await restrictedKV.clearExpired();

          expect(doNothing).not.toHaveBeenCalled();
        });

        test("should send an event with expiredKeys", async() => {
          const lastTry = Date.now() - (90 * 1_000 * 60);
          const payload = { failure: 3, lastTry, locked: true };
          const key = randomValue();

          await restrictedKV.setValue({ key, value: payload });

          await restrictedKV.clearExpired();
          expect(doNothing).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe("allowedAttempt", () => {
    const allowedAttempt = 2;

    let restrictedKV: RestrictedKV;

    beforeAll(() => {
      restrictedKV = new RestrictedKV({ prefix: "auth-", allowedAttempt });
    });

    it("should be instantiated", () => {
      expect(restrictedKV).toBeInstanceOf(RestrictedKV);
      expect(restrictedKV).toBeInstanceOf(EventEmitter);
    });

    test("should lock the key after allowedAttempt fail instead of 3", async() => {
      const lastTry = Date.now();
      const payload = { failure: 2, lastTry, locked: false };
      const key = randomValue();

      await restrictedKV.setValue({ key, value: payload });

      const attempt = await restrictedKV.fail(key);
      expect(attempt).toHaveProperty("failure", payload.failure + 1);
      expect(attempt).toHaveProperty("locked", true);
    });
  });

  describe("banTime", () => {
    const allowedAttempt = 2;
    const banTime = 60;

    const key = randomValue();
    const lastTry = Date.now();
    const payload = { failure: 1, lastTry, locked: false };

    let restrictedKV: RestrictedKV;

    beforeAll(async() => {
      restrictedKV = new RestrictedKV({ prefix: "auth-", allowedAttempt, banTimeInSecond: banTime });

      await restrictedKV.setValue({ key, value: payload });
    });

    it("should be instantiated", () => {
      expect(restrictedKV).toBeInstanceOf(RestrictedKV);
      expect(restrictedKV).toBeInstanceOf(EventEmitter);
    });

    test("should unlock the key after the given banTime", async() => {
      await timers.setTimeout(3_600);

      const attempt = await restrictedKV.getValue(key);
      expect(attempt).toHaveProperty("failure", payload.failure);
    });
  });
});

describe("autoClearInterval database suite", () => {
  let restrictedKV: RestrictedKV;

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

    await restrictedKV.setValue({ key, value: payload });

    await timers.setTimeout(5_000);

    expect(restrictedKV.getAttempt(key)).resolves.toMatchObject({
      failure: 0,
      locked: false
    });
  });
});
