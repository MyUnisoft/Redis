// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test, mock } from "node:test";
import timers from "node:timers/promises";
import { Readable } from "node:stream";
import { once } from "node:events";

// Import Internal Dependencies
import { initRedis, closeAllRedis, Interpersonal } from "../../../src/index";
import { randomValue } from "../../fixtures/utils/randomValue";

// Import Types
import { Entry } from "../../../src/types/index";

// Internal Dependencies Mock
const mockedHandleEntries = mock.method(Interpersonal.prototype as any, "handleEntries", Interpersonal.prototype.handleEntries);
const mockedCreateGroup = mock.method(
  Interpersonal.prototype as any, "createGroup", (Interpersonal.prototype as any).createGroup
);
const mockedCreateConsumer = mock.method(
  Interpersonal.prototype as any, "createConsumer", (Interpersonal.prototype as any).createConsumer
);
const mockedClaimEntry = mock.method(Interpersonal.prototype as any, "claimEntry", Interpersonal.prototype.claimEntry);

let assertEntryIdCalls = 0;
function assertEntryId(entry: Partial<Entry>) {
  assert.equal(typeof entry.id, "string");

  assertEntryIdCalls++;
}

// CONSTANTS
const kEntries: string[] = [];
const kLength = 9;
const kStreamName = randomValue();
const kGroupName = randomValue();
const kFirstConsumerName = randomValue();
const kSecondConsumerName = randomValue();
const kThirdConsumerName = randomValue();
const kLastId = ">";
const kTimer = 2000;
const kDiff = 1000;
const kCount = 2;

describe("Consumer", () => {
  let firstConsumer: Interpersonal;
  let secondConsumer: Interpersonal;
  let thirdConsumer: Interpersonal;
  // Two Consumer reading & claiming concurrently on the same stream
  let firstConsumerReadable: Readable;
  let secondConsumerReadable: Readable;
  // One Consumer reading concurrently on the same stream but without claiming
  let thirdConsumerReadable: Readable;

  before(async() => {
    await initRedis({ port: Number(process.env.REDIS_PORT), host: process.env.REDIS_HOST });

    firstConsumer = new Interpersonal({
      streamName: kStreamName,
      claimOptions: {
        idleTime: 1000
      },
      groupName: kGroupName,
      consumerName: kFirstConsumerName,
      lastId: kLastId,
      count: kCount,
      frequency: kTimer
    });

    secondConsumer = new Interpersonal({
      streamName: kStreamName,
      claimOptions: {
        idleTime: 1000
      },
      groupName: kGroupName,
      consumerName: kSecondConsumerName,
      lastId: kLastId,
      count: kCount,
      frequency: kTimer
    });

    thirdConsumer = new Interpersonal({
      streamName: kStreamName,
      groupName: kGroupName,
      consumerName: kThirdConsumerName,
      lastId: kLastId,
      frequency: kTimer + kDiff
    });

    await firstConsumer.init();
    await secondConsumer.init();
    await thirdConsumer.init();

    for (let index = 0; index < (kLength / 3); index++) {
      for (const consumer of [firstConsumer, secondConsumer, thirdConsumer]) {
        kEntries.push(await consumer.push({ foo: "bar" }, {}));
      }
    }

    firstConsumerReadable = Readable.from(firstConsumer[Symbol.asyncIterator]());
    firstConsumerReadable.on("readable", async() => {
      const chunk: Entry[] = firstConsumerReadable.read();

      for (const entry of chunk) {
        assertEntryId(entry);
        await firstConsumer.claimEntry(entry.id);
        kEntries.splice(kEntries.indexOf(entry.id), 1);
      }
    });

    secondConsumerReadable = Readable.from(secondConsumer[Symbol.asyncIterator]());
    secondConsumerReadable.on("readable", async() => {
      const chunk: Entry[] = secondConsumerReadable.read();

      for (const entry of chunk) {
        assertEntryId(entry);
        await secondConsumer.claimEntry(entry.id);
        kEntries.splice(kEntries.indexOf(entry.id), 1);
      }
    });

    thirdConsumerReadable = Readable.from(thirdConsumer[Symbol.asyncIterator]());
    thirdConsumerReadable.on("readable", async() => {
      const chunk: Entry[] = thirdConsumerReadable.read();

      for (const entry of chunk) {
        assertEntryId(entry);

        continue;
      }
    });
  });

  after(async() => {
    secondConsumerReadable.destroy();
    thirdConsumerReadable.destroy();

    const promises = [once(secondConsumerReadable, "close"), once(thirdConsumerReadable, "close")];
    await Promise.all(promises);

    await closeAllRedis();
  });

  test(`WHEN calling init()
        THEN it should init the stream, create the group & the consumer`,
  async() => {
    assert.equal(mockedCreateGroup.mock.calls.length, 3);
    assert.equal(mockedCreateConsumer.mock.calls.length, 3);
  });

  test(`WHEN calling getConsumersData
        THEN it should return data on every consumer in the same group`,
  async() => {
    const consumerData = await firstConsumer.getConsumerData();

    if (consumerData) {
      assert.equal(consumerData.name, firstConsumer.consumerName);
    }
    else {
      throw new Error("consumerData is undefined");
    }
  });

  test(`GIVEN two different consumers
        WHEN calling push
        THEN they should have push data on the same stream`,
  async() => {
    assert.equal(await firstConsumer.getLength(), kLength);
  });

  test(`GIVEN multiple Concurrent Consumer
        WHEN consuming data on the same stream
        THEN they should not deal with the same data`,
  async() => {
    await timers.setTimeout(kTimer + 400);

    assert.equal(assertEntryIdCalls, 4);
    assert.equal(mockedClaimEntry.mock.calls.length, 4);
    assert.equal(mockedHandleEntries.mock.calls.length, 2);

    assert.equal(kEntries.length, 5);
  });

  test(`GIVEN a first Consumer that didn't claim an entry he was working on for X milliseconds
        & a second Consumer that auto claim
        WHEN consuming data on the same stream
        THEN the second Consumer should deal with the data
        that the first Consumer was working on and that he didn't claim`,
  async() => {
    await timers.setTimeout(kDiff);

    assert.equal(assertEntryIdCalls, 9);
    assert.equal(mockedClaimEntry.mock.calls.length, 4);
    assert.equal(mockedHandleEntries.mock.calls.length, 3);

    assert.equal(kEntries.length, 5);

    await timers.setTimeout(kDiff);

    assert.equal(assertEntryIdCalls, 13);
    assert.equal(mockedClaimEntry.mock.calls.length, 8);
    assert.equal(mockedHandleEntries.mock.calls.length, 5);

    assert.equal(kEntries.length, 1);
  });

  describe("deleteConsumer", () => {
    test(`WHEN calling deleteConsumer for the first time
          THEN it should delete the actual Consumer`,
    async() => {
      firstConsumerReadable.destroy();
      once(firstConsumerReadable, "close");

      await firstConsumer.deleteConsumer();
    });

    test(`WHEN calling deleteConsumer consecutively for the same Consumer
          THEN it should do nothing`,
    async() => {
      await firstConsumer.deleteConsumer();
    });
  });
});

