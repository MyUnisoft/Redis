// Import Node.js Dependencies
import { Readable } from "stream";
import { once } from "events";

// Import Internal Dependencies
import { initRedis, closeRedis, Interpersonal } from "../../../src/index";
import { randomValue } from "../../fixtures/utils/randomValue";

// Import Types
import { Entry } from "../../../src/types/index";

// Internal Dependencies Mock
const mockedHandleEntries = jest.spyOn(Interpersonal.prototype as any, "handleEntries");
const mockedCreateGroup = jest.spyOn(Interpersonal.prototype as any, "createGroup");
const mockedCreateConsumer = jest.spyOn(Interpersonal.prototype as any, "createConsumer");
const mockedClaimEntry = jest.spyOn(Interpersonal.prototype as any, "claimEntry");
const mockedEvents = jest.fn((entry) => {
  expect(typeof entry.id).toBe("string"); // Entry ID
});


// CONSTANTS
let firstConsumer: Interpersonal;
let secondConsumer: Interpersonal;
let thirdConsumer: Interpersonal;
// Two Consumer reading & claiming concurrently on the same stream
let firstConsumerReadable: Readable;
let secondConsumerReadable: Readable;
// One Consumer reading concurrently on the same stream but without claiming
let thirdConsumerReadable: Readable;
const entries: string[] = [];
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
  beforeAll(async() => {
    await initRedis({ port: process.env.REDIS_PORT } as any);

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
        entries.push(await consumer.push({ foo: "bar" }, {}));
      }
    }

    firstConsumerReadable = Readable.from(firstConsumer[Symbol.asyncIterator]());
    firstConsumerReadable.on("readable", async() => {
      const chunk: Entry[] = firstConsumerReadable.read();

      for (const entry of chunk) {
        mockedEvents(entry);
        await firstConsumer.claimEntry(entry.id);
        entries.splice(entries.indexOf(entry.id), 1);
      }
    });

    secondConsumerReadable = Readable.from(secondConsumer[Symbol.asyncIterator]());
    secondConsumerReadable.on("readable", async() => {
      const chunk: Entry[] = secondConsumerReadable.read();

      for (const entry of chunk) {
        mockedEvents(entry);
        await secondConsumer.claimEntry(entry.id);
        entries.splice(entries.indexOf(entry.id), 1);
      }
    });

    thirdConsumerReadable = Readable.from(thirdConsumer[Symbol.asyncIterator]());
    thirdConsumerReadable.on("readable", async() => {
      const chunk: Entry[] = thirdConsumerReadable.read();

      for (const entry of chunk) {
        mockedEvents(entry);

        continue;

        await thirdConsumer.claimEntry(entry.id);
        entries.splice(entries.indexOf(entry.id), 1);
      }
    });
  });

  test(`WHEN calling init()
        THEN it should init the stream, create the group & the consumer`,
  async() => {
    expect(mockedCreateGroup).toHaveBeenCalledTimes(3);
    expect(mockedCreateConsumer).toHaveBeenCalledTimes(3);
  });

  test(`WHEN calling getConsumersData
        THEN it should return data on every consumer in the same group`,
  async() => {
    expect.assertions(1);
    const consumerData = await firstConsumer.getConsumerData();

    if (consumerData) {
      expect(consumerData.name).toBe(firstConsumer.consumerName);
    }
  });

  test(`GIVEN two different consumers
        WHEN calling push
        THEN they should have push data on the same stream`,
  async() => {
    expect(await firstConsumer.getLength()).toBe(kLength);
  });

  test(`GIVEN multiple Concurrent Consumer
        WHEN consuming data on the same stream
        THEN they should not deal with the same data`,
  async() => {
    await new Promise((resolve) => setTimeout(resolve, kTimer + 400));

    expect(mockedEvents).toHaveBeenCalledTimes(4);
    expect(mockedClaimEntry).toHaveBeenCalledTimes(4);
    expect(mockedHandleEntries).toHaveBeenCalledTimes(2);

    expect(entries.length).toBe(5);
  });

  test(`GIVEN a first Consumer that didn't claim an entry he was working on for X milliseconds
        & a second Consumer that auto claim
        WHEN consuming data on the same stream
        THEN the second Consumer should deal with the data
        that the first Consumer was working on and that he didn't claim`,
  async() => {
    await new Promise((resolve) => setTimeout(resolve, kDiff));

    expect(mockedEvents).toHaveBeenCalledTimes(9);
    expect(mockedClaimEntry).toHaveBeenCalledTimes(4);
    expect(mockedHandleEntries).toHaveBeenCalledTimes(3);

    expect(entries.length).toBe(5);

    await new Promise((resolve) => setTimeout(resolve, kDiff));

    expect(mockedEvents).toHaveBeenCalledTimes(13);
    expect(mockedClaimEntry).toHaveBeenCalledTimes(8);
    expect(mockedHandleEntries).toHaveBeenCalledTimes(5);
    expect(entries.length).toBe(1);
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
          THEN it should throw an Error`,
    async() => {
      expect.assertions(1);

      try {
        await firstConsumer.deleteConsumer();
      }
      catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async() => {
    secondConsumerReadable.destroy();
    thirdConsumerReadable.destroy();

    const promises = [once(secondConsumerReadable, "close"), once(thirdConsumerReadable, "close")];
    await Promise.all(promises);

    await closeRedis();
  });
});

