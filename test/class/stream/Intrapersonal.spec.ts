// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test, mock } from "node:test";
import timers from "node:timers/promises";
import { once } from "node:events";
import { Readable } from "node:stream";

// Import Internal Dependencies
import { Intrapersonal } from "../../../src";
import { randomValue } from "../../fixtures/utils/randomValue";

// Import Types
import { Entry } from "../../../src/types/index";

// Internal Dependencies Mock
const mockedHandleEntries = mock.method(Intrapersonal.prototype as any, "handleEntries", Intrapersonal.prototype.handleEntries);

let assertEntryIdCalls = 0;
function assertEntryId(entry: Partial<Entry>) {
  assert.equal(typeof entry.id, "string");

  assertEntryIdCalls++;
}

// CONSTANTS
const kEntries: string[] = [];
const kStreamName = randomValue();
const kLastId = "0-0";
const kCount = 3;
const kFrequency = 300;

describe("basicStream instance", () => {
  let intrapersonalStream: Intrapersonal;
  let readable: Readable;

  before(async() => {
    intrapersonalStream = new Intrapersonal({
      streamName: kStreamName,
      lastId: kLastId,
      count: kCount,
      frequency: kFrequency
    });

    await intrapersonalStream.initialize();
    await intrapersonalStream.init();

    assert.ok(await intrapersonalStream.streamExist());

    for (let index = 0; index < kCount; index++) {
      kEntries.push(await intrapersonalStream.push({ foo: "bar" }, {}));
    }

    readable = Readable.from(intrapersonalStream[Symbol.asyncIterator]());
    readable.on("readable", () => {
      const chunk: Entry[] = readable.read();

      for (const entry of chunk) {
        assertEntryId(entry);
        kEntries.splice(kEntries.indexOf(entry.id), 1);
      }
    });
  });

  after(async() => {
    readable.destroy();

    await once(readable, "close");
    await intrapersonalStream.close();
  });

  test("reading data", async() => {
    await timers.setTimeout(kFrequency + 100);

    assert.equal(mockedHandleEntries.mock.calls.length, 1);
    assert.equal(assertEntryIdCalls, 3);

    for (let index = 0; index < kCount; index++) {
      kEntries.push(await intrapersonalStream.push({ foo: "bar" }, {}));
    }

    await timers.setTimeout(kFrequency);

    assert.equal(mockedHandleEntries.mock.calls.length, 2);
    assert.equal(assertEntryIdCalls, 6);

    await timers.setTimeout(kFrequency);

    assert.equal(mockedHandleEntries.mock.calls.length, 2);
    assert.equal(assertEntryIdCalls, 6);

    for (let index = 0; index < kCount; index++) {
      kEntries.push(await intrapersonalStream.push({ foo: "bar" }, {}));
    }

    await timers.setTimeout(kFrequency);

    assert.equal(mockedHandleEntries.mock.calls.length, 3);
    assert.equal(assertEntryIdCalls, 9);
  });

  describe("consume", () => {
    before(async() => {
      for (let index = 0; index < 10; index++) {
        const entryId = await intrapersonalStream.push({ foo: "bar" }, {});

        kEntries.push(entryId);
      }
    });

    test(`GIVEN X as count in options
          WHEN calling consume
          THEN it should call handleEntries and return X entries`,
    async() => {
      const count = 1;
      const resolvedEntries = await intrapersonalStream.consume({ count, lastId: intrapersonalStream.lastId });

      if (resolvedEntries) {
        assert.equal(resolvedEntries.length, count);
        assert.equal(resolvedEntries[0].id, kEntries[0]);

        kEntries.splice(kEntries.indexOf(resolvedEntries[0].id), 1);
      }
      else {
        throw new Error("Unresolved entries");
      }
    });

    test(`GIVEN X as this.count
          WHEN calling consume
          THEN it should call handleEntries and return X entries`,
    async() => {
      const resolvedEntries = await intrapersonalStream.consume();

      if (resolvedEntries) {
        assert.equal(resolvedEntries.length, kCount);
        assert.equal(resolvedEntries[0].id, kEntries[0]);

        for (const entry of resolvedEntries) {
          kEntries.splice(kEntries.indexOf(entry.id), 1);
        }
      }
      else {
        throw new Error("Unresolved entries");
      }
    });

    test(`GIVEN undefined in as count option
          WHEN calling consume
          THEN it should call handleEntries and return * entries`,
    async() => {
      const resolvedEntries = await intrapersonalStream.consume({ count: undefined, lastId: intrapersonalStream.lastId });

      if (resolvedEntries) {
        for (const entry of resolvedEntries) {
          kEntries.splice(kEntries.indexOf(entry.id), 1);
        }
      }

      assert.deepEqual(await intrapersonalStream.consume(), []);
    });
  });

  describe("cleanStream", () => {
    before(async() => {
      for (let index = 0; index < 10; index++) {
        const entryId = await intrapersonalStream.push({ foo: "bar" }, {});

        kEntries.push(entryId);
      }
    });

    test(`WHEN calling cleanStream
          THEN it should deal with the rest of entries`,
    async() => {
      const cleanedEntries = await intrapersonalStream.cleanStream();
      if (cleanedEntries) {
        assert.equal(cleanedEntries.length, kEntries.length);
      }
      else {
        throw new Error("No cleaned entries");
      }
    });
  });
});
