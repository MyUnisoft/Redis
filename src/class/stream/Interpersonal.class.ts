// Import Node.js Dependencies
import timers from "node:timers/promises";

// Import Third-party Dependencies
import { RedisKey, RedisValue } from "ioredis";

// Import Internal Dependencies
import {
  Stream,
  StreamOptions,
  ConsumeOptions
} from "./Stream.class.js";
import * as utils from "../../utils/stream/index.js";
import type {
  Entry
} from "../../types/index.js";

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

  constructor(options: InterpersonalOptions) {
    const {
      groupName,
      consumerName,
      claimOptions,
      ...StreamOptions
    } = options;

    super(StreamOptions);

    this.groupName = groupName;
    this.consumerName = consumerName;
    this.claimOptions = claimOptions;
  }

  async* [Symbol.asyncIterator]() {
    while (true) {
      let entries: Entry[] = [];

      await timers.setTimeout(this.frequency);

      if (this.claimOptions) {
        entries = await this.claim(this.claimOptions);
      }

      if (entries.length === 0) {
        entries = await this.consume();
      }

      yield entries;
    }
  }

  override async init(): Promise<void> {
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

      streamResults = await this.connection.xreadgroup(...optionsWithCount);
    }
    else {
      const optionsWithoutCount = [...redisOptions] as [
        groupConsumerToken: "GROUP",
        group: string | Buffer,
        consumer: string | Buffer,
        streamsToken: "STREAMS",
        ...args: RedisValue[]
      ];

      streamResults = await this.connection.xreadgroup(...optionsWithoutCount);
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
    const redisOptions = utils.createRedisOptions(
      this.streamName, this.groupName, this.consumerName, idleTime, "0-0", { count: this.count }
    );

    let streamResults: any;
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

      streamResults = await this.connection.xautoclaim(...optionsWithCount);
    }
    else {
      const optionsWithoutCount = [...redisOptions] as [
        key: RedisKey,
        group: RedisKey,
        consumer: RedisKey,
        minIdleTime: number,
        start: RedisKey | number
      ];

      streamResults = await this.connection.xautoclaim(...optionsWithoutCount);
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
    await this.connection.xack(this.streamName, this.groupName, entryId);
    await this.delEntry(entryId);
  }

  override async getConsumerData(): Promise<utils.XINFOConsumerData | undefined> {
    const consumers = await this.connection.xinfo("CONSUMERS", this.streamName, this.groupName);

    const formattedConsumers = utils.parseXINFOConsumers(consumers as utils.XINFOConsumers);

    return formattedConsumers.find((consumer) => consumer.name === this.consumerName);
  }

  override async groupExist(): Promise<boolean> {
    const groups = await this.getGroupsData();

    if (!groups.ok) {
      throw new Error(groups.val);
    }

    return groups.unwrap().some((group) => group.name === this.groupName);
  }

  override async createGroup(): Promise<void> {
    const exist = await this.groupExist();
    if (exist) {
      return;
    }

    await this.connection.xgroup("CREATE", this.streamName, this.groupName, "$", "MKSTREAM");
  }

  override async deleteGroup() {
    const exist = await this.groupExist();
    if (!exist) {
      return;
    }

    await this.connection.xgroup("DESTROY", this.streamName, this.groupName);
  }

  override async consumerExist(): Promise<boolean> {
    const consumer = await this.getConsumerData();

    return typeof consumer !== "undefined";
  }

  override async createConsumer(): Promise<void> {
    const exist = await this.consumerExist();
    if (exist) {
      return;
    }

    await this.connection.xgroup("CREATECONSUMER", this.streamName, this.groupName, this.consumerName);
  }

  override async deleteConsumer(): Promise<void> {
    const exist = await this.consumerExist();
    if (!exist) {
      return;
    }

    await this.connection.xgroup("DELCONSUMER", this.streamName, this.groupName, this.consumerName);
  }
}
