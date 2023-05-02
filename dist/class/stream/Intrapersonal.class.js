"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intrapersonal = void 0;
// Import Internal Depencencies
const Stream_class_1 = require("./Stream.class");
const index_1 = require("../../utils/stream/index");
/**
 *
 * @description Handling intrapersonal communication through a redis stream
 */
class Intrapersonal extends Stream_class_1.Stream {
    async *[Symbol.asyncIterator]() {
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, this.frequency));
            yield await this.consume();
        }
    }
    async consume(options = { count: this.count, lastId: this.lastId }) {
        const { lastId, count, block } = options;
        const redisOptions = (0, index_1.createRedisOptions)({ count, streams: this.streamName }, lastId);
        let streamResults;
        if (count) {
            const optionsWithCount = [...redisOptions];
            streamResults = await this.redis.xread(...optionsWithCount);
        }
        else if (block) {
            const optionsWithBlock = [...redisOptions];
            streamResults = await this.redis.xread(...optionsWithBlock);
        }
        else if (block && count) {
            const optionsWithBlockAndCount = [...redisOptions];
            streamResults = await this.redis.xread(...optionsWithBlockAndCount);
        }
        else {
            const optionsWithoutCount = [...redisOptions];
            streamResults = await this.redis.xread(...optionsWithoutCount);
        }
        if (!streamResults) {
            return [];
        }
        // Only working with one stream at a time for now
        const [, entries] = streamResults[0];
        return await this.handleEntries(entries);
    }
    async cleanStream() {
        return await this.consume({ count: undefined, lastId: this.lastId });
    }
}
exports.Intrapersonal = Intrapersonal;
//# sourceMappingURL=Intrapersonal.class.js.map