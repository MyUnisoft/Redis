"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVPeer = void 0;
// Import Node.js Dependencies
const node_events_1 = require("node:events");
// Import Internal Dependencies
const __1 = require("..");
// CONSTANTS
const kDefaultKVType = "raw";
/**
* @class KVPeer
* @extends EventEmitter
* @description This class is used to store and retrieve key-value peers in Redis.
*
* @property {Redis} redis - Instance of Redis connection
* @property {string} [prefix = ""] - prefix for keys
*
* @example
* ```ts
* new KVPeer();
* new KVPeer({ prefix: "myPrefix" });
* ```
*/
class KVPeer extends node_events_1.EventEmitter {
    constructor(options = {}) {
        super();
        const { prefix, type, mapValue } = options;
        this.prefix = prefix ? `${prefix}-` : "";
        this.type = type ?? kDefaultKVType;
        this.mapValue = mapValue ?? this.defaultMapValue;
    }
    defaultMapValue(value) {
        return value;
    }
    get redis() {
        const redis = (0, __1.getRedis)();
        if (!redis) {
            throw new Error("Redis must be init");
        }
        return redis;
    }
    async setValue(options) {
        const { key, value, expiresIn } = options;
        const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
        const multiRedis = this.redis.multi();
        if (this.type === "raw") {
            const payload = typeof value === "string" ? value : JSON.stringify(value);
            multiRedis.set(finalKey, payload);
        }
        else {
            const propsMap = new Map(Object.entries(value).map(([key, value]) => {
                if (typeof value === "object") {
                    return [key, JSON.stringify(value)];
                }
                return [key, value];
            }));
            multiRedis.hmset(finalKey, propsMap);
        }
        if (expiresIn) {
            multiRedis.pexpire(finalKey, expiresIn);
        }
        await multiRedis.exec();
        return finalKey;
    }
    async getValue(key) {
        const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
        const result = this.type === "raw" ?
            await this.redis.get(finalKey) :
            deepParse(await this.redis.hgetall(finalKey));
        if (this.type === "object" && result && Object.keys(result).length === 0) {
            return null;
        }
        return result === null ? null : this.mapValue(result);
    }
    async deleteValue(key) {
        const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
        return this.redis.del(finalKey);
    }
}
exports.KVPeer = KVPeer;
function deepParse(object) {
    function* parse() {
        for (const [key, value] of Object.entries(object)) {
            if (typeof value !== "object" || !isNaN(Number(value))) {
                try {
                    yield [key, JSON.parse(value)];
                }
                catch {
                    yield [key, value];
                }
            }
            else {
                yield [key, value];
            }
        }
    }
    return Object.fromEntries(parse());
}
//# sourceMappingURL=KVPeer.class.js.map