// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, it, test } from "node:test";

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

    test("Given any value, it should store the given value", async() => {
      const resultedKey = await memoryAdapter.setValue({ key, value });

      assert.equal(resultedKey.val, key);
    });

    test("Given a key that already exist, it should throw", async() => {
      const result = await memoryAdapter.setValue({ key, value });

      assert.equal(result.err, true);

      memoryAdapter.deleteValue(key);
    });
  });

  describe("deleteValue", () => {
    const key = "foo";
    const value = "bar";

    const memoryAdapter = new MemoryAdapter();

    before(async() => {
      await memoryAdapter.setValue({ key, value });
    });

    test("Given a value that exist, it return 1", async() => {
      const result = await memoryAdapter.deleteValue(key);

      assert.equal(result, 1);
    });

    test("Given a value that exist, it return 0", async() => {
      const result = await memoryAdapter.deleteValue(key);

      assert.equal(result, 0);
    });
  });

  describe("getValue", () => {
    const key = "foo";
    const fakeKey = "fake";
    const value = { value: "bar", lastTry: Date.now() };

    const memoryAdapter = new MemoryAdapter<{ value: string, lastTry: number }>();

    test("Given a key that exist, it should return the related value", async() => {
      memoryAdapter.setValue({ key, value });

      const result = await memoryAdapter.getValue(key);

      assert.equal(result, value);
    });

    test("Given a key that doesn't exist, it should return null", async() => {
      const result = await memoryAdapter.getValue(fakeKey);

      assert.equal(result, null);
    });
  });
});
