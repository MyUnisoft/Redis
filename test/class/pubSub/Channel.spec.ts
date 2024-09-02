// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test } from "node:test";
import timers from "node:timers/promises";

// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import {
  Connection,
  Channel,
  PublishOptions
} from "../../../src/index";

// Mocks
const mockedEventsArgs: any[] = [];
function mockedEvents(...args: any) {
  mockedEventsArgs.push(args);
}

describe("Channel", () => {
  let connection: Connection;

  before(async() => {
    connection = new Connection({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    });

    await connection.initialize();
  });

  after(async() => {
    await connection.close();
  });

  describe("Channel with extInstance", () => {
    let channel: Channel;

    // CONSTANTS
    const name = "channel";

    before(async() => {
      channel = new Channel({
        name,
        connection
      });
    });

    test("channel should be instance of Channel", async() => {
      assert.ok(channel instanceof Channel);
      assert.ok(channel.name, name);
    });
  });

  describe("Channel with local instance", () => {
    describe("Channel without prefix & metadata", () => {
      let channel: Channel;
      let subscriber: Connection;

      // CONSTANTS
      const name = "channel";

      before(async() => {
        channel = new Channel({
          name,
          connection
        });

        subscriber = new Connection({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });

        await subscriber.initialize();

        await subscriber.subscribe(name);
        subscriber.on("message", (channel, message) => mockedEvents(channel, message));
      });

      after(async() => {
        await subscriber.close();
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

        await channel.publish(options);

        await timers.setTimeout(1_000);

        assert.deepEqual(mockedEventsArgs.shift(), [name, JSON.stringify(options)]);
      });
    });

    describe("Channel with prefix", () => {
      let channel: Channel;
      let subscriber: Connection;

      // CONSTANTS
      const name = "channel";
      const prefix = "prefix";
      const prefixedName = `${prefix}-${name}`;

      before(async() => {
        channel = new Channel({
          name,
          prefix,
          connection
        });

        subscriber = new Connection({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });

        await subscriber.initialize();

        await subscriber.subscribe(prefixedName);
        subscriber.on("message", (channel, message) => mockedEvents(channel, message));
      });

      after(async() => {
        await subscriber.close();
      });

      test("channel should be instance of Channel", async() => {
        assert.ok(channel instanceof Channel);
        assert.ok(channel.name, prefixedName);
      });

      test(`WHEN calling publish,
            THEN it should send a new message`, async() => {
        const options = {
          data: {
            event: "foo",
            foo: "bar"
          }
        };

        await channel.publish(options);

        await timers.setTimeout(1_000);

        assert.deepEqual(mockedEventsArgs.shift(), [prefixedName, JSON.stringify(options)]);
      });
    });

    describe("Channel with metadata", () => {
      interface Metadata {
        bar: string;
      }

      let channel: Channel<Record<string, any>, Metadata>;
      let subscriber: Connection;

      // CONSTANTS
      const name = "channel";

      before(async() => {
        channel = new Channel<Record<string, any>, Metadata>({
          name,
          connection
        });

        subscriber = new Connection({
          port: Number(process.env.REDIS_PORT),
          host: process.env.REDIS_HOST
        });

        await subscriber.initialize();

        await subscriber.subscribe(name);
        subscriber.on("message", (channel, message) => mockedEvents(channel, message));
      });

      after(async() => {
        await subscriber.close();
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

        await channel.publish(options);

        await timers.setTimeout(1_000);

        assert.deepEqual(mockedEventsArgs.shift(), [name, JSON.stringify(options)]);
      });
    });
  });
});
