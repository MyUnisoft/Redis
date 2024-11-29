// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, it, test } from "node:test";
import timers from "node:timers/promises";

// Import Internal Dependencies
import { MemoryAdapter } from "../../../src/class/adapter/memory.adapter";

describe("MemoryAdapter", () => {
  describe("Default instantiation", () => {
    const memoryAdapter = new MemoryAdapter();

    it("Should be well instantiated", async() => {
      assert.ok(memoryAdapter instanceof MemoryAdapter);
    });
  });

  describe("SetValue", () => {
    const key = "foo";
    const value = "bar";

    const memoryAdapter = new MemoryAdapter();

    test("Given any value, it should store the given value", () => {
      const resultedKey = memoryAdapter.setValue({ key, value });

      assert.equal(resultedKey.val, key);
    });

    test("Given a key that already exist, it should throw", () => {
      const result = memoryAdapter.setValue({ key, value });

      assert.equal(result.err, true);

      memoryAdapter.deleteValue(key);
    });
  });

  describe("deleteValue", () => {
    const key = "foo";
    const value = "bar";

    const memoryAdapter = new MemoryAdapter();

    before(() => {
      memoryAdapter.setValue({ key, value });
    });

    test("Given a value that exist, it return 1", () => {
      const result = memoryAdapter.deleteValue(key);

      assert.equal(result, 1);
    });

    test("Given a value that exist, it return 0", () => {
      const result = memoryAdapter.deleteValue(key);

      assert.equal(result, 0);
    });
  });

  describe("clearExpired", () => {
    const key = "foo";
    const value = { value: "bar", lastTry: Date.now() };

    const memoryAdapter = new MemoryAdapter();

    it("Should clear expired key for the given banTimeInSecond", async() => {
      memoryAdapter.setValue({ key, value });

      await timers.setTimeout(100);

      const result = memoryAdapter.clearExpired(0);

      assert.equal(result[0], key);
    });
  });

  describe("getValue", () => {
    const key = "foo";
    const fakeKey = "fake";
    const value = { value: "bar", lastTry: Date.now() };

    const memoryAdapter = new MemoryAdapter();

    test("Given a key that exist, it should return the related value", () => {
      memoryAdapter.setValue({ key, value });

      const result = memoryAdapter.getValue(key);

      assert.equal(result, value);
    });

    test("Given a key that doesn't exist, it should return null", () => {
      const result = memoryAdapter.getValue(fakeKey);

      assert.equal(result, null);
    });
  });
});
