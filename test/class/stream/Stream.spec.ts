// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test } from "node:test";
import EventEmitter from "node:events";

// Import Internal Dependencies
import { Stream } from "../../../src";
import { randomValue } from "../../fixtures/utils/randomValue";

// CONSTANTS
const kStreamName = randomValue();
const entries: string[] = [];
const kLength = 10;
const kParseRegex = new RegExp("-([0-9])");
const kFrequency = 3000;

describe("RedisStream instance", () => {
  let stream: Stream;

  before(async() => {
    stream = new Stream({
      streamName: kStreamName,
      lastId: "0-0",
      frequency: kFrequency,
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    });

    await stream.initialize();

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

    await stream.close(true);
  });

  test("should instantiate with differents options in constructor", () => {
    assert.ok(stream instanceof Stream);
  });

  describe("Push", () => {
    test(`GIVEN a String for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const entryId = await stream.push({ foo: "bar" });

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
      });

      await stream.delEntry(entryId);

      assert.equal(typeof entryId, "string");
    });

    test(`GIVEN a Number for value
        WHEN calling push
        THEN it should return a String`,
    async() => {
      const entryId = await stream.push({ key: "foo", value: 20 });

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

      const res = await stream.delEntry(id);

      assert.equal(res.err, true);
      assert.equal(res.val, `Failed entry deletion for ${id}`);
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

      let foundEntries = await stream.getRange(options);
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

      let foundEntries = await stream.getRevRange(options);
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
    test(`GIVEN a number as threshold
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

    test(`GIVEN a string as threshold
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

  describe("createGroup", () => {
    test(`GIVEN a name that does exist
    WHEN calling groupExist
    THEN it should create the group`,
    async() => {
      const groupName = "group";

      await stream.createGroup(groupName);
      const groupExist = await stream.groupExist(groupName);
      assert.equal(groupExist, true);
    });
  });

  describe("groupExist", () => {
    test(`GIVEN a name that doesn't exist
          WHEN calling groupExist
          THEN it should return false`,
    async() => {
      const groupExist = await stream.groupExist("bar");
      assert.equal(groupExist, false);
    });

    test(`GIVEN a name that does exist
          WHEN calling groupExist
          THEN it should return true`,
    async() => {
      const groupName = "group";

      await stream.createGroup(groupName);
      const groupExist = await stream.groupExist(groupName);
      assert.equal(groupExist, true);
    });
  });

  describe("createConsumer", () => {
    test(`GIVEN a groupName that doesn't exist
          WHEN calling createConsumer
          THEN it should throw`,
    async() => {
      try {
        await stream.createConsumer("foo", "consumer");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName that does exist
          WHEN calling createConsumer
          THEN it should create the consumer for the given group`,
    async() => {
      const groupName = "group";
      const consumerName = "consumer";

      await stream.createConsumer(groupName, consumerName);
      const consumerExist = await stream.consumerExist(groupName, consumerName);
      assert.equal(consumerExist, true);
    });
  });

  describe("consumerExist", async() => {
    test(`GIVEN a groupName that doesn't exist
    WHEN calling consumerExist
    THEN it should throw`,
    async() => {
      try {
        await stream.consumerExist("bar", "consumer");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName that exist & consumerName that doesn't exist
        WHEN calling consumerExist
        THEN it should return false`,
    async() => {
      const groupName = "group";

      await stream.createGroup(groupName);
      const consumerExist = await stream.consumerExist(groupName, "bar");
      assert.equal(consumerExist, false);
    });

    test(`GIVEN a groupName that exist & a consumerName that does exist
        WHEN calling consumerExist
        THEN it should return true`,
    async() => {
      const groupName = "group";
      const consumerName = "consumer";

      await stream.createGroup(groupName);
      await stream.createConsumer(groupName, consumerName);
      const consumerExist = await stream.consumerExist(groupName, consumerName);
      assert.equal(consumerExist, true);
    });
  });

  describe("getConsumerData", async() => {
    test(`GIVEN a groupName that doesn't exist
          WHEN calling getConsumerData
          THEN it should throw`,
    async() => {
      try {
        await stream.getConsumerData("bar", "consumer");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName that does exist & a consumerName that doesn't exist
          WHEN calling getConsumerData
          THEN it should throw`,
    async() => {
      try {
        await stream.getConsumerData("group", "bar");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName & a consumerName that does exist
          WHEN calling getConsumerData
          THEN it return the according data`,
    async() => {
      const groupName = "group";
      const consumerName = "consumer";

      await stream.createGroup(groupName);
      await stream.createConsumer(groupName, consumerName);
      const consumerData = await stream.getConsumerData(groupName, consumerName);

      assert.ok(consumerData);
      assert.equal(consumerData.name, consumerName);
    });
  });

  describe("deleteConsumer", async() => {
    test(`GIVEN a groupName that doesn't exist
    WHEN calling deleteConsumer
    THEN it should throw`,
    async() => {
      try {
        await stream.deleteConsumer("bar", "consumer");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName that does exist & a consumerName that doesn't exist
        WHEN calling deleteConsumer
        THEN it should throw`,
    async() => {
      try {
        await stream.deleteConsumer("bar", "consumer");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName & a consumerName that does exist
        WHEN calling deleteConsumer
        THEN it should delete the consumer`,
    async() => {
      const groupName = "group";
      const consumerName = "consumer";

      await stream.createGroup(groupName);
      await stream.createConsumer(groupName, consumerName);

      await stream.deleteConsumer(groupName, consumerName);
      const consumerExist = await stream.consumerExist(groupName, consumerName);

      assert.equal(consumerExist, false);
    });
  });

  describe("deleteGroup", async() => {
    test(`GIVEN a groupName that doesn't exist
    WHEN calling deleteGroup
    THEN it should throw`,
    async() => {
      try {
        await stream.deleteGroup("bar");
      }
      catch (error) {
        assert.ok(error);
      }
    });

    test(`GIVEN a groupName that does exist
        WHEN calling groupName
        THEN it should delete the group`,
    async() => {
      const groupName = "group";

      await stream.createGroup(groupName);
      await stream.deleteGroup(groupName);
      const groupExist = await stream.groupExist(groupName);

      assert.equal(groupExist, false);
    });
  });

  test(`WHEN calling getInfo
        THEN it should return data about the current Stream`,
  async() => {
    assert.ok(await stream.getInfo());
  });
});

