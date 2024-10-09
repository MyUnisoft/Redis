// Import Node.js Dependencies
import assert from "node:assert";
import { describe, before, after, test } from "node:test";
import timers from "node:timers/promises";

// Import Internal Dependencies
import {
  Channel,
  PublishOptions
} from "../../../src/index";

// Mocks
const mockedEventsArgs: any[] = [];
function mockedEvents(...args: any) {
  mockedEventsArgs.push(args);
}

describe("Channel", () => {
  describe("Channel with extInstance", () => {
    let channel: Channel;

    // CONSTANTS
    const name = "channel";

    before(async() => {
      channel = new Channel({
        name
      });

      await channel.initialize();
    });

    after(async() => {
      await channel.close();
    });

    test("channel should be instance of Channel", async() => {
      assert.ok(channel instanceof Channel);
      assert.ok(channel.name, name);
    });
  });

  describe("Channel with local instance", () => {
    describe("Channel without prefix & metadata", () => {
      let channel: Channel;

      // CONSTANTS
      const name = "channel";

      before(async() => {
        channel = new Channel({
          name
        });

        await channel.initialize();

        await channel.subscribe(name);
        channel.on("message", (channel, message) => mockedEvents(channel, message));
      });

      after(async() => {
        await channel.close();
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

    describe("Channel with prefix", () => {
      let channel: Channel;

      // CONSTANTS
      const name = "channel";
      const prefix = "prefix";
      const prefixedName = `${prefix}-${name}`;

      before(async() => {
        channel = new Channel({
          name,
          prefix
        });

        await channel.initialize();

        await channel.subscribe(prefixedName);
        channel.on("message", (channel, message) => mockedEvents(channel, message));
      });

      after(async() => {
        await channel.close();
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

        await channel.pub(options);

        await timers.setTimeout(1_000);

        assert.deepEqual(mockedEventsArgs.shift(), [prefixedName, JSON.stringify(options)]);
      });
    });

    describe("Channel with metadata", () => {
      interface Metadata {
        bar: string;
      }

      let channel: Channel<Record<string, any>, Metadata>;

      // CONSTANTS
      const name = "channel";

      before(async() => {
        channel = new Channel<Record<string, any>, Metadata>({
          name
        });

        await channel.initialize();

        await channel.subscribe(name);
        channel.on("message", (channel, message) => mockedEvents(channel, message));
      });

      after(async() => {
        await channel.close();
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
});
