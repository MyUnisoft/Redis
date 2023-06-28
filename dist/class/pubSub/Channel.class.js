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
        return (0, __1.getRedis)();
    }
    async publish(options) {
        await this.redis.publish(this.name, JSON.stringify(options));
    }
}
exports.Channel = Channel;
//# sourceMappingURL=Channel.class.js.map