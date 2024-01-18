"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVPeer = void 0;
// Import Node.js Dependencies
const node_events_1 = require("node:events");
// Import Internal Dependencies
const __1 = require("..");
// Import Third-Party Dependencies
const msgpackr_1 = require("msgpackr");
// CONSTANTS
const kDefaultKVType = "raw";
const kWrongRedisCommandError = "WRONGTYPE Operation against a key holding the wrong kind of value";
const packr = new msgpackr_1.Packr({
    maxSharedStructures: 8160,
    structures: []
});
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
        this.customPack = packr.pack.bind(packr);
        this.customUnpack = packr.unpack.bind(packr);
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
            const buffer = this.customPack(value);
            multiRedis.set(finalKey, buffer);
        }
        if (expiresIn) {
            multiRedis.pexpire(finalKey, expiresIn);
        }
        await multiRedis.exec();
        return finalKey;
    }
    async getValue(key) {
        const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
        const result = (this.type === "raw" ?
            await this.redis.get(finalKey) :
            await this.handlePackedOrMappedObject(finalKey));
        if (this.type === "object" && result && Object.keys(result).length === 0) {
            return null;
        }
        return result === null ? null : this.mapValue(result);
    }
    async deleteValue(key) {
        const finalKey = typeof key === "object" ? Buffer.from(this.prefix + key) : this.prefix + key;
        return this.redis.del(finalKey);
    }
    deepParse(object) {
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
    async handlePackedOrMappedObject(key) {
        let result = null;
        try {
            const packedValue = await this.redis.getBuffer(key);
            if (packedValue !== null) {
                result = this.customUnpack(packedValue);
            }
        }
        catch (error) {
            if (error.message !== kWrongRedisCommandError) {
                throw error;
            }
            result = this.deepParse(await this.redis.hgetall(key));
        }
        return result;
    }
}
exports.KVPeer = KVPeer;
//# sourceMappingURL=KVPeer.class.js.map