// Import Node.js Dependencies
import { EventEmitter } from "node:events";

// Import Third-party Dependencies
import { RedisValue } from "ioredis";

// Import Internal Depencencies
import { Connection } from "../../index";
import * as utils from "../../utils/stream/index";

// Import Types
import {
  Data,
  Entry,
  Group
} from "../../types/index";

// CONSTANTS
const kDefaultRangeOptions = { min: "-", max: "+" };
const kMinId = "0-0";

export interface StreamOptions {
  streamName: string;
  /**
   * Interval of time between two iteration on the stream
   */
  frequency: number;
  /**
   * Reference to the minimal ID we iterate from
   */
  lastId?: string;
  /**
   * Number of entries it must pull at each iteration
   */
  count?: number;
  connection: Connection;
}

export interface GetRangeOptions {
  /**
   * Reference to the minimal ID we pull from
   */
  min: string;
  /**
   * Reference to the maximal ID we pull to
   */
  max: string;
  /**
   * Number of max entries pulled out
   */
  count?: number;
}

export interface XINFOStreamData {
  length: number;
  radixTreeKeys: number;
  radixTreeNodes: number;
  lastGeneratedId: string;
  entries: Entry[];
  groups?: Group[];
}

export interface ConsumeOptions {
  lastId: string;
  count?: number;
  block?: number;
}

export interface PushOptions {
  id?: string;
  metadata?: string;
}

/**
 *
 * @description Shared method used to work on a Redis Stream
 */
export class Stream extends EventEmitter {
  public streamName: string;
  public lastId: string;

  protected frequency: number;
  protected count?: number;

  constructor(options: StreamOptions) {
    super();

    this.streamName = options.streamName;
    this.frequency = options.frequency;
    this.count = options.count;
    this.lastId = options.lastId ?? kMinId;
  }

  get redis() {
    const redis = getRedis();

    if (!redis) {
      throw new Error("Redis must be init");
    }

    return redis;
  }

  public async streamExist(): Promise<boolean> {
    try {
      await this.redis.xinfo("STREAM", this.streamName);

      return true;
    }
    catch {
      return false;
    }
  }

  /**
   *
   * @description In order to create a new Redis stream, we must push a first entry
   */
  public async init(): Promise<void> {
    if (await this.streamExist()) {
      return;
    }

    await this.redis.xadd(this.streamName, "0-1", "init", "stream");
    await this.redis.xdel(this.streamName, "0-1");
  }

  public async getInfo(): Promise<XINFOStreamData> {
    const formattedStreamData = {};

    const streamData = await this.redis.xinfo("STREAM", this.streamName, "FULL", "COUNT", 0) as utils.XRedisData;

    for (const [key, value] of utils.parseData(streamData)) {
      formattedStreamData[key as string] = value;
    }

    return formattedStreamData as XINFOStreamData;
  }

  public async getLength(): Promise<number> {
    return await this.redis.xlen(this.streamName);
  }

  public async getGroupsData(): Promise<utils.XINFOGroupData[]> {
    try {
      const groups = await this.redis.xinfo("GROUPS", this.streamName) as utils.XINFOGroups;

      return utils.parseXINFOGroups(groups);
    }
    catch {
      throw new Error("Stream not initialiazed yet.");
    }
  }

  /**
   *
   * @description Push a new entry on the stream, if no ID provided, use the special ID "*".
   * Using the special ID "*", Redis generate IDs as follow 1526985685298-0, the first part
   * being a timestamp, and the second an increment.
   * @param {data: { key: string; value: string | Buffer | number }, options: { id?: string; metadata?: string }} [options]
   * @returns {Promise<string>}
   * @example
   * ```ts
   * // Push an Entry with a custom ID
   * const entryId = await push({ foo: "bar" }, { id: "any-custom-id" });
   * console.log(entryId) // "any-custom-string"
   * ```
   * @example
   * ```ts
   * // Push an Entry without a custom ID
   * const entryId = await push({ foo: "bar" }, { metadata: "" });
   * console.log(entryId) // 1526985685298-0
   * ```
   */
  public async push(data: Data, options?: PushOptions): Promise<string> {
    const { id, metadata } = options ?? {};
    const entries: RedisValue[] = [];

    if (metadata) {
      entries.push("metadata", metadata);
    }

    for (const [key, value] of Object.entries(data)) {
      entries.push(key, value);
    }

    const formattedId = id ?? "*";

    return await this.redis.xadd(this.streamName, formattedId, ...entries) as string;
  }

  public async delEntry(entryId: string): Promise<void> {
    const res = await this.redis.xdel(this.streamName, entryId);

    if (res !== 1) {
      throw new Error(`Failed entry deletion for ${entryId}`);
    }

    return;
  }

  public async handleEntries(entries: utils.XEntries, cursor?: string): Promise<Entry[]> {
    this.lastId = cursor || entries[entries.length - 1][0] as string;

    return utils.parseEntries(entries);
  }

  /**
   *
   * @description Return a range of elements in a stream, with IDs matching the specified IDs interval.
   * @param {{ min: string; max: string; count?: number; }} [options={ min: "-", max: "+" }]
   * @returns {Promise<Entry[]>}
   * @example
   * ```ts
   * // Return all entries
   * await getRange({ min: "-", max: "+" })
   * ```
   * @example
   * ```ts
   * // Return single Entry
   * await getRange({ min: "1526985685298-0", max: "1526985685298-0" })
   * ```
   * @example
   * ```ts
   * // Return entries between those timestamp (inclusive)
   * await getRange({ min: "1526985054069", max: "1526985055069"})
   * ```
   * @example
   * ```ts
   * // Return Entry with id 1526985676425-0 & 1526985685298-0
   * await getRange({ min: "-", max: "+", count: 2})
   * // Return two next Entry, "(" exluding the given id
   * await getRange({ min: "(1526985685298-0", max: "+", count: 2 })
   * ```
   */
  public async getRange(options: GetRangeOptions = kDefaultRangeOptions): Promise<Entry[]> {
    const { min, max, count } = options;
    const redisOptions = utils.createRedisOptions(this.streamName, min, max, { count }) as unknown;

    return utils.parseEntries(await this.redis.xrange(...redisOptions as utils.FormattedRedisOptions));
  }

  /**
   *
   * @description Return a range of elements in a stream, with IDs matching the specified IDs interval,
   * in reverse order (from greater to smaller IDs).
   * @param {{ min: string; max: string; count?: number; }} [options={ min: "-", max: "+" }]
   * @returns {Promise<Entry[]>}
   * @example
   * ```ts
   * // Return all entries
   * await getRevRange({ min: "-", max: "+" })
   * ```
   * @example
   * ```ts
   * // Return single Entry
   * await getRevRange({ min: "1526985685298-0", max: "1526985685298-0" })
   * ```
   * @example
   * ```ts
   * // Return entries between those timestamp (inclusive)
   * await getRevRange({ min: "1526985054069", max: "1526985055069"})
   * ```
   * @example
   * ```ts
   * // Return Entry with id 1526985676425-0 & 1526985685298-0
   * await getRevRange({ min: "-", max: "+", count: 2})
   * // Return two next Entry, "(" exluding the given id
   * await getRevRange({ min: "(1526985685298-0", max: "+", count: 2 })
   * ```
   */
  public async getRevRange(options: GetRangeOptions = kDefaultRangeOptions): Promise<Entry[]> {
    const { min, max, count } = options;
    const redisOptions = utils.createRedisOptions(this.streamName, max, min, { count }) as unknown;

    return utils.parseEntries(await this.redis.xrevrange(...redisOptions as utils.FormattedRedisOptions));
  }

  /**
   *
   * @description Trim the stream, if the threshold is a number, then it is considered as a max-length,
   * if the threshold is a string, then it is considered as a reference to an ID/Timestamp.
   * @param {(number | string)} threshold
   * @returns {Promise<number>}
   * @example
   * ```ts
   * // Given a number, it acts like a max-lenght
   * for (let index = 0; index < 1000; index++) await push({ data: { key: "foo", value: "bar" }})
   * const nbEvictedEntry = await trim(900)
   * console.log(nbEvictedEntry) // 100
   * ```
   */
  public async trim(threshold: number | string): Promise<number> {
    return typeof threshold === "number" ?
      await this.redis.xtrim(
        this.streamName,
        "MAXLEN",
        threshold
      ) :
      await this.redis.xtrim(
        this.streamName,
        "MINID",
        threshold
      );
  }

  /**
   *
   * @description Check whenever a given group exist for the initialized Stream.
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  public async groupExist(name: string): Promise<boolean> {
    const groups = await this.getGroupsData();

    return groups.some((group) => group.name === name);
  }

  /**
   *
   * @description Create a new group related to the initialized Stream.
   * @param {string} name
   */
  public async createGroup(name: string): Promise<void> {
    const exist = await this.groupExist(name);
    if (exist) {
      return;
    }

    await this.redis.xgroup("CREATE", this.streamName, name, "$", "MKSTREAM");
  }

  /**
   *
   * @description Delete a group related to the initialized Stream.
   * @param {string} name
   */
  public async deleteGroup(name: string) {
    const exist = await this.groupExist(name);
    if (!exist) {
      return;
    }

    await this.redis.xgroup("DESTROY", this.streamName, name);
  }

  /**
   *
   * @description Return Consumer data for a given group related to the initialized Stream.
   * @param {string} groupName
   * @param {string} consumerName
   * @returns {Promise<utils.XINFOConsumerData | undefined>}
   */
  public async getConsumerData(groupName: string, consumerName: string): Promise<utils.XINFOConsumerData | undefined> {
    const consumers = await this.redis.xinfo("CONSUMERS", this.streamName, groupName);

    const formattedConsumers = utils.parseXINFOConsumers(consumers as utils.XINFOConsumers);

    return formattedConsumers.find((consumer) => consumer.name === consumerName);
  }

  /**
   *
   * @description Check whenever a consumer exist for a given group related to the initialized Stream.
   * @param {string} groupName
   * @param {string} consumerName
   * @returns {Promise<boolean>}
   */
  public async consumerExist(groupName: string, consumerName: string): Promise<boolean> {
    const consumer = await this.getConsumerData(groupName, consumerName);

    return typeof consumer !== "undefined";
  }

  /**
   *
   * @description Create a new consumer for a given group related to the initialized Stream.
   * @param {string} groupName
   * @param {string} consumerName
   */
  public async createConsumer(groupName: string, consumerName: string): Promise<void> {
    const exist = await this.consumerExist(groupName, consumerName);
    if (exist) {
      return;
    }

    await this.redis.xgroup("CREATECONSUMER", this.streamName, groupName, consumerName);
  }

  /**
   *
   * @description Delete a consumer for a given group related to the initialized Stream.
   * @param {string} groupName
   * @param {string} consumerName
   */
  public async deleteConsumer(groupName: string, consumerName: string): Promise<void> {
    const exist = await this.consumerExist(groupName, consumerName);
    if (!exist) {
      return;
    }

    await this.redis.xgroup("DELCONSUMER", this.streamName, groupName, consumerName);
  }
}
