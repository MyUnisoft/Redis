"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = void 0;
// Import Node.js Dependencies
const node_events_1 = require("node:events");
// Import Internal Depencencies
const index_1 = require("../../index");
const utils = __importStar(require("../../utils/stream/index"));
// CONSTANTS
const kDefaultRangeOptions = { min: "-", max: "+" };
const kMinId = "0-0";
/**
 *
 * @description Shared method used to work on a Redis Stream
 */
class Stream extends node_events_1.EventEmitter {
    constructor(options) {
        super();
        this.streamName = options.streamName;
        this.frequency = options.frequency;
        this.count = options.count;
        this.lastId = options.lastId ?? kMinId;
    }
    get redis() {
        const redis = (0, index_1.getRedis)();
        if (!redis) {
            throw new Error("Redis must be init");
        }
        return redis;
    }
    async streamExist() {
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
    async init() {
        if (await this.streamExist()) {
            return;
        }
        await this.redis.xadd(this.streamName, "0-1", "init", "stream");
        await this.redis.xdel(this.streamName, "0-1");
    }
    async getInfo() {
        const formattedStreamData = {};
        const streamData = await this.redis.xinfo("STREAM", this.streamName, "FULL", "COUNT", 0);
        for (const [key, value] of utils.parseData(streamData)) {
            formattedStreamData[key] = value;
        }
        return formattedStreamData;
    }
    async getLength() {
        return await this.redis.xlen(this.streamName);
    }
    async getGroupsData() {
        try {
            const groups = await this.redis.xinfo("GROUPS", this.streamName);
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
    async push(data, options) {
        const { id, metadata } = options;
        const entries = [];
        if (metadata) {
            entries.push("metadata", metadata);
        }
        for (const [key, value] of Object.entries(data)) {
            entries.push(key, value);
        }
        const formattedId = id ?? "*";
        return await this.redis.xadd(this.streamName, formattedId, ...entries);
    }
    async delEntry(entryId) {
        const res = await this.redis.xdel(this.streamName, entryId);
        if (res !== 1) {
            throw new Error(`Failed entry deletion for ${entryId}`);
        }
        return;
    }
    async handleEntries(entries, cursor) {
        this.lastId = cursor || entries[entries.length - 1][0];
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
    async getRange(options = kDefaultRangeOptions) {
        const { min, max, count } = options;
        const redisOptions = utils.createRedisOptions(this.streamName, min, max, { count });
        return utils.parseEntries(await this.redis.xrange(...redisOptions));
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
    async getRevRange(options = kDefaultRangeOptions) {
        const { min, max, count } = options;
        const redisOptions = utils.createRedisOptions(this.streamName, max, min, { count });
        return utils.parseEntries(await this.redis.xrevrange(...redisOptions));
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
    async trim(threshold) {
        return typeof threshold === "number" ?
            await this.redis.xtrim(this.streamName, "MAXLEN", threshold) :
            await this.redis.xtrim(this.streamName, "MINID", threshold);
    }
    /**
     *
     * @description Check whenever a given group exist for the initialized Stream.
     * @param {string} name
     * @returns {Promise<boolean>}
     */
    async groupExist(name) {
        const groups = await this.getGroupsData();
        return groups.some((group) => group.name === name);
    }
    /**
     *
     * @description Create a new group related to the initialized Stream.
     * @param {string} name
     */
    async createGroup(name) {
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
    async deleteGroup(name) {
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
    async getConsumerData(groupName, consumerName) {
        const consumers = await this.redis.xinfo("CONSUMERS", this.streamName, groupName);
        const formattedConsumers = utils.parseXINFOConsumers(consumers);
        return formattedConsumers.find((consumer) => consumer.name === consumerName);
    }
    /**
     *
     * @description Check whenever a consumer exist for a given group related to the initialized Stream.
     * @param {string} groupName
     * @param {string} consumerName
     * @returns {Promise<boolean>}
     */
    async consumerExist(groupName, consumerName) {
        const consumer = await this.getConsumerData(groupName, consumerName);
        return typeof consumer !== "undefined";
    }
    /**
     *
     * @description Create a new consumer for a given group related to the initialized Stream.
     * @param {string} groupName
     * @param {string} consumerName
     */
    async createConsumer(groupName, consumerName) {
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
    async deleteConsumer(groupName, consumerName) {
        const exist = await this.consumerExist(groupName, consumerName);
        if (!exist) {
            return;
        }
        await this.redis.xgroup("DELCONSUMER", this.streamName, groupName, consumerName);
    }
}
exports.Stream = Stream;
//# sourceMappingURL=Stream.class.js.map