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
exports.Interpersonal = void 0;
// Import Internal Depencencies
const Stream_class_1 = require("./Stream.class");
const utils = __importStar(require("../../utils/stream/index"));
/**
 *
 * @description Abstraction of a Consumer (replication of a service) rattached to a Group (nature of a service)
 * to handle interpersonal communication through a redis stream
 */
class Interpersonal extends Stream_class_1.Stream {
    constructor(options) {
        const { groupName, consumerName, claimOptions, ...StreamOptions } = options;
        super(StreamOptions);
        this.groupName = groupName;
        this.consumerName = consumerName;
        this.claimOptions = claimOptions;
    }
    async *[Symbol.asyncIterator]() {
        while (true) {
            let entries = [];
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
    async init() {
        await super.init();
        await this.createGroup();
        await this.createConsumer();
    }
    async consume(options = { count: this.count, lastId: this.lastId }) {
        const { count, lastId } = options;
        const redisOptions = utils.createRedisOptions({ group: this.groupName }, this.consumerName, { count, streams: this.streamName }, lastId);
        let streamResults;
        if (count) {
            const optionsWithCount = [...redisOptions];
            streamResults = await this.redis.xreadgroup(...optionsWithCount);
        }
        else {
            const optionsWithoutCount = [...redisOptions];
            streamResults = await this.redis.xreadgroup(...optionsWithoutCount);
        }
        if (!streamResults) {
            return [];
        }
        // Only working with one stream at a time for now
        const [, entries] = streamResults[0];
        return await this.handleEntries(entries, ">");
    }
    async claim(options) {
        const { idleTime } = options;
        const redisOptions = utils.createRedisOptions(this.streamName, this.groupName, this.consumerName, idleTime, "0-0", { count: this.count });
        let streamResults;
        if (this.count) {
            const optionsWithCount = [...redisOptions];
            streamResults = await this.redis.xautoclaim(...optionsWithCount);
        }
        else {
            const optionsWithoutCount = [...redisOptions];
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
    async claimEntry(entryId) {
        await this.redis.xack(this.streamName, this.groupName, entryId);
        await this.delEntry(entryId);
    }
    async getConsumerData() {
        const consumers = await this.redis.xinfo("CONSUMERS", this.streamName, this.groupName);
        const formatedConsumers = utils.parseXINFOConsumers(consumers);
        return formatedConsumers.find((consumer) => consumer.name === this.consumerName);
    }
    async groupExist() {
        const groups = await this.getGroupsData();
        return groups.some((group) => group.name === this.groupName);
    }
    async createGroup() {
        if (await this.groupExist()) {
            return;
        }
        await this.redis.xgroup("CREATE", this.streamName, this.groupName, "$", "MKSTREAM");
    }
    async consumerExist() {
        const consumer = await this.getConsumerData();
        if (!consumer) {
            return false;
        }
        return true;
    }
    async createConsumer() {
        if (await this.consumerExist()) {
            return;
        }
        await this.redis.xgroup("CREATECONSUMER", this.streamName, this.groupName, this.consumerName);
    }
    async deleteConsumer() {
        const consumerExist = await this.consumerExist();
        if (!consumerExist) {
            throw new Error("Consumer dosn't exist.");
        }
        await this.redis.xgroup("DELCONSUMER", this.streamName, this.groupName, this.consumerName);
    }
}
exports.Interpersonal = Interpersonal;
//# sourceMappingURL=Interpersonal.class.js.map