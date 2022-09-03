// Import Node.js Dependencies
import EventEmitter from "events";

// Import Internal Dependencies
import { initRedis, closeRedis, Stream } from "../../../src";
import { randomValue } from "../../fixtures/utils/randomValue";

// Import Types
import { Entry } from "../../../src/types/index";

// CONSTANTS
let redisStream: Stream;
const kStreamName = randomValue();
const entries: string[] = [];
const kLength = 10;
const kParseRegex = new RegExp("-([0-9])");
const kFrequency = 3000;

describe("RedisStream instance", () => {
  beforeAll(async() => {
    await initRedis({ port: process.env.REDIS_PORT } as any);
    redisStream = new Stream({ streamName: kStreamName, lastId: "0-0", frequency: kFrequency });

    const streamExist = await redisStream.streamExist();

    if (!streamExist) {
      await redisStream.init();
    }

    expect(await redisStream.streamExist()).toBe(true);


    for (let index = 0; index < kLength; index++) {
      const entryId = await redisStream.push({ foo: "bar" }, { metadata: "fake-metadata" });

      if (typeof entryId === "string") {
        entries.push(entryId);
      }
    }
  });

  test("should instantiate with differents options in constructor", () => {
    expect(redisStream).toBeInstanceOf(Stream);
    expect(redisStream).toBeInstanceOf(EventEmitter);
  });

  describe("Push", () => {
    test(`GIVEN a String for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const entryId = await redisStream.push({ foo: "bar" }, {});

      await redisStream.delEntry(entryId);

      expect(typeof entryId).toStrictEqual("string");
    });

    test(`GIVEN a Buffer for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const fakePayload = {
        foo: "bar",
        isTrue: true,
        number: 20
      };
      const entryId = await redisStream.push({
          key: "foo",
          value: Buffer.from(JSON.stringify(fakePayload))
        }, {});

      await redisStream.delEntry(entryId);

      expect(typeof entryId).toStrictEqual("string");
    });

    test(`GIVEN a Number for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const entryId = await redisStream.push({ key: "foo", value: 20 }, {});

      await redisStream.delEntry(entryId);

      expect(typeof entryId).toStrictEqual("string");
    });

    test(`GIVEN a custom ID
          WHEN calling push
          THEN it should push it with the custom ID & a timestamp`,
    async() => {
      const entryId = await redisStream.push({ foo: "bar" }, { metadata: "fake_memberGroup_id_postUrl" });

      await redisStream.delEntry(entryId);

      expect(typeof entryId).toStrictEqual("string");
    });

    test(`GIVEN a custom ID already used/smaller than the last entry
          WHEN calling push
          THEN it should reject an Error`,
    async() => {
      const alreadyUsedId = entries[0];

      try {
        await redisStream.push({ foo: "bar" }, { id: alreadyUsedId });
      }
      catch (error) {
        expect(error.message)
        .toBe("ERR The ID specified in XADD is equal or smaller than the target stream top item");
      }
    });
  });

  describe("delEntry", () => {
    test(`GIVEN a bad entryId
    WHEN calling delEntry
    THEN it should throw Error`,
    async() => {
      const id = "00";

      try {
        await redisStream.delEntry(id);
      }
      catch (error) {
        expect(error.message).toStrictEqual(`Failed entry deletion for ${id}`);
      }
    });
  });

  describe("getRange", () => {
    test(`GIVEN "-" & "+" as min & max options
          WHEN calling getRange
          THEN it should return all entries`,
    async() => {
      const foundEntries = await redisStream.getRange();

      expect(foundEntries.length).toBe(kLength);
    });

    test(`GIVEN X as a number for count option
          WHEN calling getRange
          THEN it should not return more than X entries`,
    async() => {
      const options = {
        min: "-",
        max: "+",
        count: 5
      };

      let foundEntries: Entry[] = [];

      foundEntries = await redisStream.getRange(options);
      expect(foundEntries.length).toBeLessThanOrEqual(options.count);

      options.count = 12;
      foundEntries = await redisStream.getRange(options);
      expect(foundEntries.length).toBeLessThanOrEqual(options.count);
    });

    test(`GIVEN the same id for min & max options
          WHEN calling getRange
          THEN it should return the associated entry`,
    async() => {
      const options = {
        min: entries[0],
        max: entries[0]
      };

      const entry = await redisStream.getRange(options);
      expect(entry[0].id).toBe(entries[0]);
    });

    test(`GIVEN a timestamp for min or max options
          WHEN calling getRange
          THEN it should return only olders entries`,
    async() => {
      const matches = entries[2].match(kParseRegex);
      const options = {
        min: entries[2].replace(matches![0], ""),
        max: "+",
        count: 2
      };

      const foundEntries = await redisStream.getRange(options);

      expect(
        Number(foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        ))
      ).toBeGreaterThanOrEqual(Number(options.min));
    });

    test(`GIVEN a timestamp/id with "(" symbol for min
          WHEN calling getRevRange
          THEN it should return only olders entries excluding provided one`,
    async() => {
      const matches = entries[2].match(kParseRegex);
      const timeStamp = entries[2].replace(matches![0], "");
      const options = {
        min: `(${timeStamp}`,
        max: "+",
        count: 2
      };

      const foundEntries = await redisStream.getRange(options);

      expect(
        Number(foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        ))
      ).not.toBe(`${timeStamp}-0`);
    });
  });

  describe("getRevRange", () => {
    test(`GIVEN "-" & "+" as min & max options
          WHEN calling getRevRange
          THEN it should return all entries but in reverse order`,
    async() => {
      const foundEntries = await redisStream.getRevRange();

      expect(foundEntries.length).toBe(kLength);
      expect(foundEntries[0].id).toBe(entries[9]);
    });

    test(`GIVEN X as a number for count option
        WHEN calling getRevRange
        THEN it should not return more than X entries`,
    async() => {
      const options = {
        max: "+",
        min: "-",
        count: 5
      };

      let foundEntries: Entry[] = [];

      foundEntries = await redisStream.getRevRange(options);
      expect(foundEntries.length).toBeLessThanOrEqual(options.count);

      options.count = 12;
      foundEntries = await redisStream.getRevRange(options);
      expect(foundEntries.length).toBeLessThanOrEqual(options.count);
    });

    test(`GIVEN the same id for min & max options
          WHEN calling getRevRange
          THEN it should return the associated entry`,
    async() => {
      const options = {
        min: entries[0],
        max: entries[0]
      };

      const entry = await redisStream.getRevRange(options);
      expect(entry[0].id).toBe(entries[0]);
    });

    test(`GIVEN a timestamp for min or max options
          WHEN calling getRevRange
          THEN it should return only olders entries`,
    async() => {
      const matches = entries[2].match(kParseRegex);
      const options = {
        min: entries[2].replace(matches![0], ""),
        max: "+",
        count: 2
      };

      const foundEntries = await redisStream.getRevRange(options);

      expect(
        Number(foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        ))
      ).toBeGreaterThanOrEqual(Number(options.min));
    });

    test(`GIVEN a timestamp/id with "(" symbol for min
          WHEN calling getRevRange
          THEN it should return only olders entries excluding provided one`,
    async() => {
      const matches = entries[2].match(kParseRegex);
      const timeStamp = entries[2].replace(matches![0], "");
      const options = {
        min: `(${timeStamp}`,
        max: "+",
        count: 2
      };

      const foundEntries = await redisStream.getRevRange(options);

      expect(
        Number(foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        ))
      ).not.toBe(`${timeStamp}-0`);
    });
  });

  describe("getLength", () => {
    test("should return the stream length", async() => {
      const length = await redisStream.getLength();

      expect(length).toBe(kLength);
    });
  });

  describe("trim", () => {
    test(`GIVEN a number as treshold
          WHEN calling trim
          THEN it should return the number of deleted entries`,
    async() => {
      let length = 10;
      expect(await redisStream.trim(length)).toBe(0);

      length = 9;
      const nbDeletedEntries = await redisStream.trim(length);
      expect(nbDeletedEntries).toBe(kLength - length);
      entries.splice(0, nbDeletedEntries);
    });

    test(`GIVEN a string as treshold
          WHEN calling trim
          THEN it should return the number of deleted entries`,
    async() => {
      let entryId = entries[0];
      expect(await redisStream.trim(entryId)).toBe(0);

      entryId = entries[1];
      const nbDeletedEntries = await redisStream.trim(entryId);
      expect(nbDeletedEntries).toBe(1);
      entries.splice(0, nbDeletedEntries);
    });
  });

  test(`WHEN calling getInfo
        THEN it should return data about the current Stream`,
  async() => {
    expect(await redisStream.getInfo()).toBeDefined();
  });

  afterAll(async() => {
    for (const entryId of entries) {
      await redisStream.delEntry(entryId);
    }

    await closeRedis();
  });
});

