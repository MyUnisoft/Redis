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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = exports.clearAllKeys = exports.getConnectionPerf = exports.closeRedis = exports.initRedis = exports.getRedis = void 0;
// Import Node.js Dependencies
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
// Import Third-party Dependencies
const ioredis_1 = __importDefault(require("ioredis"));
let localRedis;
function getRedis() {
    return localRedis;
}
exports.getRedis = getRedis;
/**
 *
 * Use to ensure the connection to the Redis instance.
 * @param {Redis} instance
 * @param {number} [attempt=4]
 * @returns
 */
async function assertConnection(instance, attempt = 4) {
    if (attempt <= 0) {
        throw new Error("Failed at initializing a Redis connection.");
    }
    const { isAlive } = await getConnectionPerf(instance);
    if (!isAlive) {
        await assertConnection(instance, attempt - 1);
    }
}
/**
* this function init the store & wait if process exit for closing the store
* @param {object} redisOptions - represent object who contains all connections options
*
*/
async function initRedis(redisOptions, extInstance) {
    const { port, host, password } = redisOptions;
    const redis = new ioredis_1.default(port, host, { password });
    await assertConnection(redis);
    if (!extInstance) {
        localRedis = redis;
    }
    return redis;
}
exports.initRedis = initRedis;
/**
  * this function is used to close the store
  * @returns void
  */
async function closeRedis(extInstance) {
    const redis = extInstance || localRedis;
    const { isAlive } = await getConnectionPerf(redis);
    if (!isAlive) {
        return;
    }
    setImmediate(() => {
        redis.quit();
    });
    await (0, events_1.once)(redis, "end");
}
exports.closeRedis = closeRedis;
async function getConnectionPerf(extInstance) {
    const redis = extInstance || localRedis;
    const start = perf_hooks_1.performance.now();
    try {
        await redis.ping();
    }
    catch {
        return { isAlive: false };
    }
    return { isAlive: true, perf: perf_hooks_1.performance.now() - start };
}
exports.getConnectionPerf = getConnectionPerf;
/**
  * this function is used to clear all keys from redis
  */
async function clearAllKeys(extInstance) {
    const redis = extInstance || localRedis;
    await redis.flushdb();
}
exports.clearAllKeys = clearAllKeys;
__exportStar(require("./class/stream/index"), exports);
__exportStar(require("./class/pubSub/Channel.class"), exports);
__exportStar(require("./class/KVPeer.class"), exports);
__exportStar(require("./class/TimedKVPeer.class"), exports);
__exportStar(require("./class/RestrictedKV.class"), exports);
exports.Types = __importStar(require("./types/index"));
//# sourceMappingURL=index.js.map