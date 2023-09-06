"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
// Import Internal Dependencies
const __1 = require("../..");
class Channel {
    constructor(options) {
        const { name, prefix } = options;
        this.name = `${prefix ? `${prefix}-` : ""}` + name;
    }
    get redis() {
        const redis = (0, __1.getRedis)();
        if (!redis) {
            throw new Error("Redis must be init");
        }
        return redis;
    }
    async publish(options) {
        await this.redis.publish(this.name, JSON.stringify(options));
    }
}
exports.Channel = Channel;
//# sourceMappingURL=Channel.class.js.map