// Import Node.js Dependencies
import { once } from "events";
import { Readable } from "stream";

// Import Internal Dependencies
import { initRedis, closeRedis, Intrapersonal } from "../../../src";
import { randomValue } from "../../fixtures/utils/randomValue";

// Import Types
import { Entry } from "../../../src/types/index";

// Internal Dependencies Mock
const mockedHandleEntries = jest.spyOn(Intrapersonal.prototype as any, "handleEntries");
const mockedEvents = jest.fn((entry) => {
  expect(typeof entry.id).toBe("string"); // Entry ID
});


// CONSTANTS
let intrapersonalStream: Intrapersonal;
let readable: Readable;
const entries: string[] = [];
const kStreamName = randomValue();
const kLastId = "0-0";
const kCount = 3;
const kFrequency = 3000;

describe("basicStream instance", () => {
  beforeAll(async() => {
    await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any);
    intrapersonalStream = new Intrapersonal({ streamName: kStreamName, lastId: kLastId, count: kCount, frequency: kFrequency });

    await intrapersonalStream.init();

    expect(await intrapersonalStream.streamExist()).toBe(true);

    for (let index = 0; index < kCount; index++) {
      entries.push(await intrapersonalStream.push({ foo: "bar" }, {}));
    }

    readable = Readable.from(intrapersonalStream[Symbol.asyncIterator]());
    readable.on("readable", () => {
      const chunk: Entry[] = readable.read();

      for (const entry of chunk) {
        mockedEvents(entry);
        entries.splice(entries.indexOf(entry.id), 1);
      }
    });
  });

  test("reading data", async() => {
    await new Promise((resolve) => setTimeout(resolve, kFrequency + 1000));

    expect(mockedHandleEntries).toHaveBeenCalledTimes(1);
    expect(mockedEvents).toHaveBeenCalledTimes(3);

    for (let index = 0; index < kCount; index++) {
      entries.push(await intrapersonalStream.push({ foo: "bar" }, {}));
    }

    await new Promise((resolve) => setTimeout(resolve, kFrequency));

    expect(mockedHandleEntries).toHaveBeenCalledTimes(2);
    expect(mockedEvents).toHaveBeenCalledTimes(6);

    await new Promise((resolve) => setTimeout(resolve, kFrequency));

    expect(mockedHandleEntries).toHaveBeenCalledTimes(2);
    expect(mockedEvents).toHaveBeenCalledTimes(6);

    for (let index = 0; index < kCount; index++) {
      entries.push(await intrapersonalStream.push({ foo: "bar" }, {}));
    }

    await new Promise((resolve) => setTimeout(resolve, kFrequency));

    expect(mockedHandleEntries).toHaveBeenCalledTimes(3);
    expect(mockedEvents).toHaveBeenCalledTimes(9);
  });

  describe("consume", () => {
    beforeAll(async() => {
      for (let index = 0; index < 10; index++) {
        const entryId = await intrapersonalStream.push({ foo: "bar" }, {});

        entries.push(entryId);
      }
    });

    test(`GIVEN X as count in options
          WHEN calling consume
          THEN it should call handleEntries and return X entries`,
    async() => {
      const count = 1;
      const resolvedEntries = await intrapersonalStream.consume({ count, lastId: intrapersonalStream.lastId });

      if (resolvedEntries) {
        expect(resolvedEntries.length).toBe(count);
        expect(resolvedEntries[0].id).toBe(entries[0]);

        entries.splice(entries.indexOf(resolvedEntries[0].id), 1);
      }
    });

    test(`GIVEN X as this.count
          WHEN calling consume
          THEN it should call handleEntries and return X entries`,
    async() => {
      const resolvedEntries = await intrapersonalStream.consume();

      if (resolvedEntries) {
        expect(resolvedEntries.length).toBe(kCount);
        expect(resolvedEntries[0].id).toBe(entries[0]);

        for (const entry of resolvedEntries) {
          entries.splice(entries.indexOf(entry.id), 1);
        }
      }
    });

    test(`GIVEN undefined in as count option
          WHEN calling consume
          THEN it should call handleEntries and return * entries`,
    async() => {
      const resolvedEntries = await intrapersonalStream.consume({ count: undefined, lastId: intrapersonalStream.lastId });

      if (resolvedEntries) {
        for (const entry of resolvedEntries) {
          entries.splice(entries.indexOf(entry.id), 1);
        }
      }

      expect(await intrapersonalStream.consume()).toStrictEqual([]);
    });
  });

  describe("cleanStream", () => {
    beforeAll(async() => {
      for (let index = 0; index < 10; index++) {
        const entryId = await intrapersonalStream.push({ foo: "bar" }, {});

        entries.push(entryId);
      }
    });

    test(`WHEN calling cleanStream
          THEN it should deal with the rest of entries`,
    async() => {
      expect.assertions(1);

      const cleanedEntries = await intrapersonalStream.cleanStream();
      if (cleanedEntries) {
        expect(cleanedEntries.length).toBe(entries.length);
      }
    });
  });

  afterAll(async() => {
    readable.destroy();

    await once(readable, "close");
    await closeRedis();
  });
});
