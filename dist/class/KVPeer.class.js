"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVPeer = void 0;
// Import Node.js Dependencies
const events_1 = require("events");
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
* new KVPeer();
* new KVPeer({ prefix: "myPrefix" });
*/
class KVPeer extends events_1.EventEmitter {
    constructor(options = {}, redis) {
        super();
        const { prefix, type, mapValue } = options;
        if (redis) {
            this.redis = redis;
        }
        this.prefix = prefix ? `${prefix}-` : "";
        this.type = type ?? kDefaultKVType;
        this.mapValue = mapValue ?? this.defaultMapValue;
    }
    defaultMapValue(value) {
        return value;
    }
    set redis(extInstance) {
        this.redis = extInstance;
    }
    get redis() {
        return (0, __1.getRedis)();
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
            const propsMap = new Map(Object.entries(value).map(([key, value]) => typeof value === "object" ? [key, JSON.stringify(value)] : [key, value]));
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