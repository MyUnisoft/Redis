// Import Third-party Dependencies
import { Redis } from "ioredis";

// Import Internal Dependencies
import { initRedis, closeRedis, Channel, PublishOptions, getSubscriber } from "../../../src/index";

// Mocks
const mockedEvents = jest.fn();

beforeAll(async() => {
  await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any);
});

afterAll(async() => {
  await closeRedis();
});

describe("Channel", () => {
  describe("Channel with extInstance", () => {
    let channel;

    // CONSTANTS
    const name = "channel";

    beforeAll(async() => {
      await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any, true);

      channel = new Channel({ name }, getSubscriber());
    });

    afterAll(async() => {
      await closeRedis(true);
    });

    test("channel should be instance of Channel", async() => {
      expect(channel).toBeInstanceOf(Channel);
      expect(channel.name).toBe(name);
    });
  });

  describe("Channel with local instance", () => {
    describe("Channel without prefix & metadata", () => {
      let channel;
      let subscriber: Redis;

      // CONSTANTS
      const name = "channel";

      beforeAll(async() => {
        channel = new Channel({ name });

        subscriber = await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any, true);

        await subscriber.subscribe(name);
        subscriber.on("message", (channel, message) => mockedEvents(channel, message));
      });

      afterAll(async() => {
        await closeRedis(true);
      });

      test("channel should be instance of Channel", async() => {
        expect(channel).toBeInstanceOf(Channel);
        expect(channel.name).toBe(name);
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

        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(mockedEvents).toHaveBeenCalledWith(name, JSON.stringify(options));
      });
    });

    describe("Channel with prefix", () => {
      let channel: Channel;
      let subscriber: Redis;

      // CONSTANTS
      const name = "channel";
      const prefix = "prefix";
      const prefixedName = `${prefix}-${name}`;

      beforeAll(async() => {
        channel = new Channel({ name, prefix });

        subscriber = await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any, true);

        await subscriber.subscribe(prefixedName);
        subscriber.on("message", (channel, message) => mockedEvents(channel, message));
      });

      afterAll(async() => {
        await closeRedis(true);
      });

      test("channel should be instance of Channel", async() => {
        expect(channel).toBeInstanceOf(Channel);
        expect(channel.name).toBe(prefixedName);
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

        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(mockedEvents).toHaveBeenCalledWith(prefixedName, JSON.stringify(options));
      });
    });

    describe("Channel with metadata", () => {
      interface Metadata {
        bar: string;
      }

      let channel: Channel<Record<string, any>, Metadata>;
      let subscriber: Redis;

      // CONSTANTS
      const name = "channel";

      beforeAll(async() => {
        channel = new Channel<Record<string, any>, Metadata>({ name });

        subscriber = await initRedis({ port: process.env.REDIS_PORT, host: process.env.REDIS_HOST } as any, true);

        await subscriber.subscribe(name);
        subscriber.on("message", (channel, message) => mockedEvents(channel, message));
      });

      afterAll(async() => {
        await closeRedis(true);
      });

      test("channel should be instance of Channel", async() => {
        expect(channel).toBeInstanceOf(Channel);
        expect(channel.name).toBe(name);
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

        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(mockedEvents).toHaveBeenCalledWith(name, JSON.stringify(options));
      });
    });
  });
});
