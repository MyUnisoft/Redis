// Import Node.js Dependencies
import timers from "node:timers/promises";

// Import Third-party Dependencies
import { RedisValue } from "ioredis";

// Import Internal Dependencies
import { Stream, type ConsumeOptions } from "./Stream.class.js";
import { createRedisOptions } from "../../utils/stream/index.js";
import type { Entry } from "../../types/index.js";

/**
 *
 * @description Handling intrapersonal communication through a redis stream
 */
export class Intrapersonal extends Stream {
  async* [Symbol.asyncIterator]() {
    while (true) {
      await timers.setTimeout(this.frequency);

      yield await this.consume();
    }
  }

  public async consume(
    options: ConsumeOptions = { count: this.count, lastId: this.lastId }
  ): Promise<Entry[]> {
    const { lastId, count, block } = options;
    const redisOptions = createRedisOptions({ count, streams: this.streamName }, lastId);

    let streamResults: any;

    if (count) {
      const optionsWithCount = [...redisOptions] as [
        countToken: "COUNT",
        count: number | string,
        streamsToken: "STREAMS",
        ...args: RedisValue[]
      ];

      streamResults = await this.connection.xread(...optionsWithCount);
    }
    else if (block) {
      const optionsWithBlock = [...redisOptions] as [
        blockToken: "BLOCK",
        block: number | string,
        streamsToken: "STREAMS",
        ...args: RedisValue[]
      ];

      streamResults = await this.connection.xread(...optionsWithBlock);
    }
    else {
      const optionsWithoutCount = [...redisOptions] as [
        streamsToken: "STREAMS",
        ...args: RedisValue[]
      ];

      streamResults = await this.connection.xread(...optionsWithoutCount);
    }

    if (!streamResults) {
      return [];
    }

    // Only working with one stream at a time for now
    const [, entries] = streamResults[0];

    return await this.handleEntries(entries);
  }

  public async cleanStream(): Promise<Entry[] | null> {
    return await this.consume({ count: undefined, lastId: this.lastId });
  }
}
