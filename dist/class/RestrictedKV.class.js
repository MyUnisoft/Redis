"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestrictedKV = void 0;
// Import Third-party requirement
const dayjs_1 = __importDefault(require("dayjs"));
// Import Internal dependencies
const KVPeer_class_1 = require("./KVPeer.class");
const __1 = require("..");
// CONSTANTS
const kDefaultAllowedAttempt = 6;
const kDefaultBanTime = 60 * 5;
/**
* @class RestrictedKV
* @classdesc Implementation to prevent brute force attacks.
*/
class RestrictedKV extends KVPeer_class_1.KVPeer {
    autoClearInterval;
    allowedAttempt;
    banTimeInSecond;
    static getDefaultAttempt() {
        return { failure: 0, lastTry: Date.now(), locked: false };
    }
    constructor(options = {}) {
        const { prefix, autoClearExpired, allowedAttempt, banTimeInSecond } = options;
        super({
            prefix: prefix ?? "limited-",
            type: "object"
        });
        this.allowedAttempt = allowedAttempt ?? kDefaultAllowedAttempt;
        this.banTimeInSecond = banTimeInSecond ?? kDefaultBanTime;
        if (autoClearExpired) {
            this.autoClearInterval = setInterval(async () => {
                try {
                    const connectionPerf = await (0, __1.getConnectionPerf)("publisher");
                    if (connectionPerf.isAlive) {
                        await this.clearExpired();
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }, autoClearExpired).unref();
        }
    }
    parseRawAttempt(data) {
        return {
            failure: Number(data.failure ?? 0),
            lastTry: Number(data.lastTry ?? Date.now()),
            locked: (data.locked ?? "false") === "true"
        };
    }
    clearAutoClearInterval() {
        if (this.autoClearInterval) {
            clearInterval(this.autoClearInterval);
        }
        this.autoClearInterval = null;
    }
    /**
     * @description Returns the number of attempts (failure, last tentative timestamp ...) for a given key
     *
     * @param key - key WITHOUT PREFIX
     *
     * @example
     * ```ts
     * handler.getAttempt("myKey")
     * ```
     */
    async getAttempt(key) {
        const data = await this.getValue(key);
        return Object.assign({}, RestrictedKV.getDefaultAttempt(), data === null ? {} : this.parseRawAttempt(data));
    }
    /**
    * @description Increment an access failure for a given key.
    * The method also allows to define whether a key is locked or not (when the number of failures exceeds the defined limitation).
    *
    * @param key - key WITHOUT PREFIX
    *
    * @example
    * ```ts
    * handler.fail("myKey")
    * ```
    */
    async fail(key) {
        const stored = await this.getAttempt(key);
        const attempt = { failure: 1, lastTry: Date.now(), locked: false };
        if (stored !== null) {
            const diff = (0, dayjs_1.default)().diff(stored.lastTry, "second");
            if (diff < this.banTimeInSecond) {
                attempt.failure = stored.failure + 1;
            }
            if (attempt.failure > this.allowedAttempt) {
                attempt.locked = true;
            }
        }
        await this.setValue({ key, value: attempt });
        return attempt;
    }
    /**
    * @description Notify a successful access for a given key. This will remove all traces of previous failed access.
    *
    * @param key - WITHOUT PREFIX
    *
    * @example
    * ```ts
    * handler.success("email@domain.com")
    * ```
    */
    async success(key) {
        const rawStored = await this.getValue(key);
        if (rawStored !== null) {
            await this.deleteValue(key);
        }
    }
    /**
    * @description Searches for all keys where the last attempt exceeds an allocated lifetime and clear (delete) them.
    *
    * @example
    * ```ts
    * handler.clearExpired()
    * ```
    */
    async clearExpired() {
        const promises = [this.redis.keysBuffer(`${this.prefix}*`), this.redis.keys(`${this.prefix}*`)];
        const data = [...await Promise.all(promises)].flat();
        if (data.length === 0) {
            return;
        }
        const results = await Promise.all(data.map(async (key) => {
            const expired = await this.isKeyExpired(key);
            return { key, expired };
        }));
        const expiredKeys = results
            .filter((row) => row.expired)
            .map((row) => row.key);
        if (expiredKeys.length > 0) {
            const pipeline = this.redis.pipeline();
            this.emit("expiredKeys", expiredKeys);
            expiredKeys.forEach((key) => pipeline.del(key));
            await pipeline.exec();
        }
    }
    async isKeyExpired(key) {
        let finalKey;
        if (typeof key === "object") {
            finalKey = Buffer.from(key.toString().slice(this.prefix.length));
        }
        else {
            finalKey = key.slice(this.prefix.length);
        }
        const attempt = await this.getValue(finalKey);
        const lastTry = "lastTry" in attempt ? Number(attempt.lastTry) : null;
        return lastTry === null ? false : (0, dayjs_1.default)().diff(lastTry, "second") >= this.banTimeInSecond;
    }
}
exports.RestrictedKV = RestrictedKV;
//# sourceMappingURL=RestrictedKV.class.js.map