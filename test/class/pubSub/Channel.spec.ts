// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test } from "node:test";
import timers from "node:timers/promises";

// Import Internal Dependencies
import {
  Channel,
  PublishOptions,
  RedisAdapter
} from "../../../src/index";

// Mocks
const mockedEventsArgs: any[] = [];
function mockedEvents(...args: any) {
  mockedEventsArgs.push(args);
}

describe("Channel", () => {
  const redis = new RedisAdapter({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST
  });

  before(async() => {
    await redis.initialize();
  });

  after(async() => {
    await redis.close();
  });

  describe("Channel without metadata", () => {
    let channel: Channel;
    let subscriber: RedisAdapter;

    const name = "channel";

    before(async() => {
      channel = new Channel({
        redis,
        name
      });

      subscriber = new RedisAdapter({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await subscriber.initialize();

      await subscriber.subscribe(name);
      subscriber.on("message", (channel, message) => mockedEvents(channel, message));
    });

    after(async() => {
      await subscriber.close(true);
    });

    test("channel should be instance of Channel", async() => {
      assert.ok(channel instanceof Channel);
      assert.ok(channel.name, name);
    });

    test(`WHEN calling publish,
          THEN it should send a new message`, async() => {
      const options = {
        data: {
          event: "foo",
          foo: "bar"
        }
      };

      await channel.pub(options);

      await timers.setTimeout(1_000);

      assert.deepEqual(mockedEventsArgs.shift(), [name, JSON.stringify(options)]);
    });
  });

  describe("Channel with metadata", () => {
    interface Metadata {
      bar: string;
    }

    let channel: Channel<Record<string, any>, Metadata>;
    let subscriber: RedisAdapter;

    // CONSTANTS
    const name = "channel";
    const redis = new RedisAdapter({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    });

    before(async() => {
      await redis.initialize();
    });

    after(async() => {
      await redis.close();
    });

    before(async() => {
      channel = new Channel<Record<string, any>, Metadata>({
        redis,
        name
      });

      subscriber = new RedisAdapter({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
      });

      await subscriber.initialize();

      await subscriber.subscribe(name);
      subscriber.on("message", (channel, message) => mockedEvents(channel, message));
    });

    after(async() => {
      await subscriber.close(true);
    });

    test("channel should be instance of Channel", async() => {
      assert.ok(channel instanceof Channel);
      assert.ok(channel.name, name);
    });

    test(`WHEN calling publish,
          THEN it should send a new message`, async() => {
      const options: PublishOptions<Record<string, any>, Metadata> = {
        data: {
          event: "foo",
          foo: "bar"
        },
        metadata: {
          bar: "foo"
        }
      };

      await channel.pub(options);

      await timers.setTimeout(1_000);

      assert.deepEqual(mockedEventsArgs.shift(), [name, JSON.stringify(options)]);
    });
  });
});
