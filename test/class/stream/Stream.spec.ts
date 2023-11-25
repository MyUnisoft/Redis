// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test } from "node:test";
import EventEmitter from "node:events";

// Import Internal Dependencies
import { initRedis, Stream, closeAllRedis } from "../../../src";
import { randomValue } from "../../fixtures/utils/randomValue";

// Import Types
import { Entry } from "../../../src/types/index";

// CONSTANTS
const kStreamName = randomValue();
const entries: string[] = [];
const kLength = 10;
const kParseRegex = new RegExp("-([0-9])");
const kFrequency = 3000;

describe("RedisStream instance", () => {
  let stream: Stream;

  before(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });
    stream = new Stream({ streamName: kStreamName, lastId: "0-0", frequency: kFrequency });

    const streamExist = await stream.streamExist();

    if (!streamExist) {
      await stream.init();
    }

    assert.ok(await stream.streamExist());


    for (let index = 0; index < kLength; index++) {
      const entryId = await stream.push({ foo: "bar" }, { metadata: "fake-metadata" });

      if (typeof entryId === "string") {
        entries.push(entryId);
      }
    }
  });

  after(async() => {
    for (const entryId of entries) {
      await stream.delEntry(entryId);
    }

    await closeAllRedis();
  });

  test("should instantiate with differents options in constructor", () => {
    assert.ok(stream instanceof Stream);
    assert.ok(stream instanceof EventEmitter);
  });

  describe("Push", () => {
    test(`GIVEN a String for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const entryId = await stream.push({ foo: "bar" }, {});

      await stream.delEntry(entryId);

      assert.equal(typeof entryId, "string");
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
      const entryId = await stream.push({
          key: "foo",
          value: Buffer.from(JSON.stringify(fakePayload))
        }, {});

      await stream.delEntry(entryId);

      assert.equal(typeof entryId, "string");
    });

    test(`GIVEN a Number for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const entryId = await stream.push({ key: "foo", value: 20 }, {});

      await stream.delEntry(entryId);

      assert.equal(typeof entryId, "string");
    });

    test(`GIVEN a custom ID
          WHEN calling push
          THEN it should push it with the custom ID & a timestamp`,
    async() => {
      const entryId = await stream.push({ foo: "bar" }, { metadata: "fake_memberGroup_id_postUrl" });

      await stream.delEntry(entryId);

      assert.equal(typeof entryId, "string");
    });

    test(`GIVEN a custom ID already used/smaller than the last entry
          WHEN calling push
          THEN it should reject an Error`,
    async() => {
      const alreadyUsedId = entries[0];

      await assert.rejects(async() => await stream.push({ foo: "bar" }, { id: alreadyUsedId }), {
        name: "ReplyError",
        message: "ERR The ID specified in XADD is equal or smaller than the target stream top item"
      });
    });
  });

  describe("delEntry", () => {
    test(`GIVEN a bad entryId
    WHEN calling delEntry
    THEN it should throw Error`,
    async() => {
      const id = "00";

      await assert.rejects(async() => stream.delEntry(id), {
        name: "Error",
        message: `Failed entry deletion for ${id}`
      });
    });
  });

  describe("getRange", () => {
    test(`GIVEN "-" & "+" as min & max options
          WHEN calling getRange
          THEN it should return all entries`,
    async() => {
      const foundEntries = await stream.getRange();

      assert.equal(foundEntries.length, kLength);
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

      foundEntries = await stream.getRange(options);
      assert.ok(foundEntries.length <= options.count);

      options.count = 12;
      foundEntries = await stream.getRange(options);
      assert.ok(foundEntries.length <= options.count);
    });

    test(`GIVEN the same id for min & max options
          WHEN calling getRange
          THEN it should return the associated entry`,
    async() => {
      const options = {
        min: entries[0],
        max: entries[0]
      };

      const entry = await stream.getRange(options);
      assert.equal(entry[0].id, entries[0]);
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

      const foundEntries = await stream.getRange(options);

      assert.ok(
        Number(foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        )) >= Number(options.min)
      );
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

      const foundEntries = await stream.getRange(options);

      assert.ok(
        foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        ) !== `${timeStamp}-0`
      );
    });
  });

  describe("getRevRange", () => {
    test(`GIVEN "-" & "+" as min & max options
          WHEN calling getRevRange
          THEN it should return all entries but in reverse order`,
    async() => {
      const foundEntries = await stream.getRevRange();

      assert.equal(foundEntries.length, kLength);
      assert.equal(foundEntries[0].id, entries[9]);
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

      foundEntries = await stream.getRevRange(options);
      assert.ok(foundEntries.length <= options.count);

      options.count = 12;
      foundEntries = await stream.getRevRange(options);
      assert.ok(foundEntries.length <= options.count);
    });

    test(`GIVEN the same id for min & max options
          WHEN calling getRevRange
          THEN it should return the associated entry`,
    async() => {
      const options = {
        min: entries[0],
        max: entries[0]
      };

      const entry = await stream.getRevRange(options);
      assert.equal(entry[0].id, entries[0]);
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

      const foundEntries = await stream.getRevRange(options);

      assert.ok(
        Number(foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        )) >= Number(options.min)
      );
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

      const foundEntries = await stream.getRevRange(options);

      assert.ok(
        foundEntries[0].id.replace(
          (foundEntries[0].id.match(kParseRegex))![0], ""
        ) !== `${timeStamp}-0`
      );
    });
  });

  describe("getLength", () => {
    test("should return the stream length", async() => {
      const length = await stream.getLength();

      assert.equal(length, kLength);
    });
  });

  describe("trim", () => {
    test(`GIVEN a number as treshold
          WHEN calling trim
          THEN it should return the number of deleted entries`,
    async() => {
      let length = 10;
      assert.equal(await stream.trim(length), 0);

      length = 9;
      const nbDeletedEntries = await stream.trim(length);
      assert.equal(nbDeletedEntries, kLength - length);
      entries.splice(0, nbDeletedEntries);
    });

    test(`GIVEN a string as treshold
          WHEN calling trim
          THEN it should return the number of deleted entries`,
    async() => {
      let entryId = entries[0];
      assert.equal(await stream.trim(entryId), 0);

      entryId = entries[1];
      const nbDeletedEntries = await stream.trim(entryId);
      assert.equal(nbDeletedEntries, 1);
      entries.splice(0, nbDeletedEntries);
    });
  });

  test(`WHEN calling getInfo
        THEN it should return data about the current Stream`,
  async() => {
    assert.ok(await stream.getInfo());
  });
});

