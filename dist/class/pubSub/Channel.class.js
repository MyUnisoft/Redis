"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
// Import Internal Dependencies
const __1 = require("../..");
class Channel {
    constructor(options, redis) {
        const { name, prefix } = options;
        this.redis = typeof redis === "undefined" ? (0, __1.getRedis)() : redis;
        this.name = `${prefix ? `${prefix}-` : ""}` + name;
    }
    async publish(options) {
        await this.redis.publish(this.name, JSON.stringify(options));
    }
}
exports.Channel = Channel;
//# sourceMappingURL=Channel.class.js.map