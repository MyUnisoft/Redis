// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test, it, beforeEach, mock, Mock } from "node:test";
import timers from "node:timers/promises";
import { EventEmitter } from "node:events";

// Import Third-party Dependencies
import MockDate from "mockdate";

// Import Internal Dependencies
import { RedisAdapter, RestrictedKV } from "../../src";
import { randomValue } from "../fixtures/utils/randomValue";

// Internal Dependencies Mock
mock.method(RestrictedKV.prototype, "deleteValue", async() => "deleteValue");

MockDate.set(Date.now());

describe("RestrictedKV", () => {
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

  describe("Instantiated with default options", () => {
    let restrictedKV: RestrictedKV;

    before(() => {
      restrictedKV = new RestrictedKV({
        adapter: redisAdapter
      });
    });

    it("should be instantiated", () => {
      assert.ok(restrictedKV instanceof RestrictedKV);
      assert.ok(restrictedKV instanceof EventEmitter);
    });

    test(`WHEN calling getDefaultAttempt
          THEN it should return a default default attempt object`, () => {
      const defaultAttempt = RestrictedKV.getDefaultAttempt();
      assert.deepStrictEqual(defaultAttempt, {
        failure: 0,
        locked: false,
        lastTry: Date.now()
      });
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
        assert.deepEqual(await restrictedKV.getAttempt(key), payload);
      });

      test(`Given a partial of Attempt object
            WHEN calling getAttempt
            THEN it should return a completed Attempt object`,
      async() => {
        const optionsWithLocked = {
          key: randomValue(),
          value: { locked: false }
        };

        await restrictedKV.setValue(optionsWithLocked);
        const attemptWithLocked = await restrictedKV.getAttempt(optionsWithLocked.key);
        assert.deepEqual(attemptWithLocked, Object.assign({},
          { lastTry: Date.now(), failure: 0 },
          optionsWithLocked.value
        ));

        const optionsWithFailure = {
          key: randomValue(),
          value: { failure: 0 }
        };

        await restrictedKV.setValue(optionsWithFailure);
        const attemptWithFailure = await restrictedKV.getAttempt(optionsWithFailure.key);
        assert.deepEqual(attemptWithFailure, Object.assign({},
          { lastTry: Date.now(), locked: false },
          optionsWithFailure.value
        ));
      });
    });

    describe("fail", () => {
      test(`Given a fake key
            WHEN calling fail
            THEN it should return a new Attempt object with failure property init at 1`,
      async() => {
        const attempt = await restrictedKV.fail("my-fake-key");
        assert.equal(attempt.failure, 1);
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
        assert.equal(attempt.failure, payload.failure + 1);
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
        assert.deepEqual(attempt, {
          failure: 0,
          locked: false,
          lastTry: Date.now()
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

        assert.equal((RestrictedKV.prototype.deleteValue as any).mock.calls.length, 1);
      });
    });

    describe("clearExpired", () => {
      test("should not clean not expired key from database", async() => {
        const payload = { failure: 0, lastTry: Date.now(), locked: false };
        const key = randomValue();

        await restrictedKV.setValue({ key, value: payload });
        await restrictedKV.clearExpired();

        assert.deepEqual(await restrictedKV.getAttempt(key), payload);
      });

      test("should clear all keys from the database when invoked", async() => {
        const lastTry = Date.now() - (90 * 1_000 * 60);
        const payload = { failure: 3, lastTry, locked: true };
        const key = randomValue();

        await restrictedKV.setValue({ key, value: payload });
        await restrictedKV.clearExpired();

        const attempt = await restrictedKV.getAttempt(key);
        assert.equal(attempt.failure, 0);
        assert.equal(attempt.locked, false);
      });

      describe("expiredKeys event", () => {
        let emitMock: Mock<any>;
        before(() => {
          // eslint-disable-next-line max-nested-callbacks
          emitMock = mock.method(RestrictedKV.prototype, "emit", () => void 0);
        });

        test("should not send an event when no cleared key", async() => {
          await restrictedKV.clearExpired();

          assert.equal(emitMock.mock.calls.length, 0);
        });

        test("should send an event with expiredKeys", async() => {
          const lastTry = Date.now() - (90 * 1_000 * 60);
          const payload = { failure: 3, lastTry, locked: true };
          const key = randomValue();

          await restrictedKV.setValue({ key, value: payload });

          await restrictedKV.clearExpired();
          assert.equal(emitMock.mock.calls.length, 1);
        });
      });
    });
  });

  describe("allowedAttempt", () => {
    const allowedAttempt = 2;

    let restrictedKV: RestrictedKV;

    before(() => {
      restrictedKV = new RestrictedKV({
        prefix: "auth-",
        allowedAttempt,
        adapter: redisAdapter
      });
    });

    it("should be instantiated", () => {
      assert.ok(restrictedKV instanceof RestrictedKV);
      assert.ok(restrictedKV instanceof EventEmitter);
    });

    test("should lock the key after allowedAttempt fail instead of 3", async() => {
      const lastTry = Date.now();
      const payload = { failure: 2, lastTry, locked: false };
      const key = randomValue();

      await restrictedKV.setValue({ key, value: payload });

      const attempt = await restrictedKV.fail(key);
      assert.equal(attempt.failure, payload.failure + 1);
      assert.equal(attempt.locked, true);
    });
  });

  describe("banTime", () => {
    const allowedAttempt = 2;
    const banTime = 60;

    const key = randomValue();
    const lastTry = Date.now();
    const payload = { failure: 1, lastTry, locked: false };

    let restrictedKV: RestrictedKV;

    before(async() => {
      restrictedKV = new RestrictedKV({
        prefix: "auth-",
        allowedAttempt,
        banTimeInSecond: banTime,
        adapter: redisAdapter
      });

      await restrictedKV.setValue({ key, value: payload });
    });

    it("should be instantiated", () => {
      assert.ok(restrictedKV instanceof RestrictedKV);
      assert.ok(restrictedKV instanceof EventEmitter);
    });

    test("should unlock the key after the given banTime", async() => {
      await timers.setTimeout(140);

      const attempt = await restrictedKV.getValue(key);
      assert.equal(attempt?.failure, payload.failure);
    });
  });

  describe("autoClearInterval database suite", () => {
    let restrictedKV: RestrictedKV;

    before(async() => {
      restrictedKV = new RestrictedKV({
        prefix: "auth-",
        autoClearExpired: 20,
        adapter: redisAdapter
      });
    });

    beforeEach(async() => {
      await redisAdapter.flushdb();
    });

    after(async() => {
      restrictedKV.clearAutoClearInterval();
    });

    it("should clear all keys from the database when invoked", async() => {
      const lastTry = Date.now() - (90 * 1_000 * 60);
      const payload = { failure: 3, lastTry, locked: true };
      const key = randomValue();

      await restrictedKV.setValue({ key, value: payload });

      await timers.setTimeout(50);

      assert.deepEqual(await restrictedKV.getAttempt(key), {
        failure: 0,
        locked: false,
        lastTry: Date.now()
      });
    });
  });
});
