// Import Third-party Dependencies
import { Redis, RedisKey, RedisValue } from "ioredis";

// Import Internal Depencencies
import {
  Stream,
  StreamOptions,
  ConsumeOptions
} from "./Stream.class";
import * as utils from "../../utils/stream/index";

// Import Types
import {
  Entry
} from "../../types/stream";

export interface ClaimOptions {
  /**
   * Time given for which a claimed entry is idle
   */
  idleTime: number;
}

export interface InterpersonalOptions extends StreamOptions {
  groupName: string;
  consumerName: string;
  claimOptions?: ClaimOptions;
}

/**
 *
 * @description Abstraction of a Consumer (replication of a service) rattached to a Group (nature of a service)
 * to handle interpersonal communication through a redis stream
 */
export class Interpersonal extends Stream {
  public consumerName: string;
  public groupName: string;

  private claimOptions?: ClaimOptions;

  constructor(options: InterpersonalOptions, redis?: Redis) {
    const {
      groupName,
      consumerName,
      claimOptions,
      ...StreamOptions
    } = options;

    super(StreamOptions, redis);

    this.groupName = groupName;
    this.consumerName = consumerName;
    this.claimOptions = claimOptions;
  }

  async *[Symbol.asyncIterator]() {
    while (true) {
      let entries: Entry[] = [];

      await new Promise((resolve) => setTimeout(resolve, this.frequency));

      if (this.claimOptions) {
        entries = await this.claim(this.claimOptions);
      }

      if (entries.length === 0) {
        entries = await this.consume();
      }

      yield entries;
    }
  }

  public async init(): Promise<void> {
    await super.init();
    await this.createGroup();
    await this.createConsumer();
  }

  public async consume(
    options: ConsumeOptions = { count: this.count, lastId: this.lastId }
  ): Promise<Entry[]> {
    const { count, lastId } = options;
    const redisOptions = utils.createRedisOptions(
      { group: this.groupName },
      this.consumerName,
      { count, streams: this.streamName },
      lastId
    );

    let streamResults;

    if (count) {
      const optionsWithCount = [...redisOptions] as [
        groupConsumerToken: "GROUP",
        group: string | Buffer,
        consumer: string | Buffer,
        countToken: "COUNT",
        count: number | string,
        streamsToken: "STREAMS",
        ...args: RedisValue[]
      ];

      streamResults = await this.redis.xreadgroup(...optionsWithCount);
    }
    else {
      const optionsWithoutCount = [...redisOptions] as [
        groupConsumerToken: "GROUP",
        group: string | Buffer,
        consumer: string | Buffer,
        streamsToken: "STREAMS",
        ...args: RedisValue[]
      ];

      streamResults = await this.redis.xreadgroup(...optionsWithoutCount);
    }

    if (!streamResults) {
      return [];
    }

    // Only working with one stream at a time for now
    const [, entries] = streamResults[0];

    return await this.handleEntries(entries, ">");
  }

  public async claim(options: ClaimOptions): Promise<Entry[]> {
    const { idleTime } = options;
    const redisOptions = utils.createRedisOptions(this.streamName, this.groupName, this.consumerName, idleTime, "0-0",
      { count: this.count });

    let streamResults;

    if (this.count) {
      const optionsWithCount = [...redisOptions] as [
        key: RedisKey,
        group: RedisKey,
        consumer: RedisKey,
        minIdleTime: number,
        start: RedisKey | number,
        countToken: "COUNT",
        count: number | string
      ];

      streamResults = await this.redis.xautoclaim(...optionsWithCount);
    }
    else {
      const optionsWithoutCount = [...redisOptions] as [
        key: RedisKey,
        group: RedisKey,
        consumer: RedisKey,
        minIdleTime: number,
        start: RedisKey | number
      ];

      streamResults = await this.redis.xautoclaim(...optionsWithoutCount);
    }

    const [cursor, entries] = streamResults;

    if (entries.length === 0) {
      return [];
    }

    if (cursor !== "0-0") {
      this.emit("rest");
    }

    return await this.handleEntries(entries, ">");
  }

  public async claimEntry(entryId: string): Promise<void> {
    await this.redis.xack(this.streamName, this.groupName, entryId);
    await this.delEntry(entryId);
  }

  public async getConsumerData(): Promise<utils.XINFOConsumerData | undefined> {
    const consumers = await this.redis.xinfo("CONSUMERS", this.streamName, this.groupName);

    const formatedConsumers = utils.parseXINFOConsumers(consumers as utils.XINFOConsumers);

    return formatedConsumers.find((consumer) => consumer.name === this.consumerName);
  }

  private async groupExist(): Promise<boolean> {
    const groups = await this.getGroupsData();

    return groups.some((group) => group.name === this.groupName);
  }

  private async createGroup(): Promise<void> {
    if (await this.groupExist()) {
      return;
    }

    await this.redis.xgroup("CREATE", this.streamName, this.groupName, "$", "MKSTREAM");
  }

  private async consumerExist(): Promise<boolean> {
    const consumer = await this.getConsumerData();

    if (!consumer) {
      return false;
    }

    return true;
  }

  private async createConsumer(): Promise<void> {
    if (await this.consumerExist()) {
      return;
    }

    await this.redis.xgroup("CREATECONSUMER", this.streamName, this.groupName, this.consumerName);
  }

  public async deleteConsumer(): Promise<void> {
    const consumerExist = await this.consumerExist();

    if (!consumerExist) {
      throw new Error("Consumer dosn't exist.");
    }

    await this.redis.xgroup("DELCONSUMER", this.streamName, this.groupName, this.consumerName);
  }
}
