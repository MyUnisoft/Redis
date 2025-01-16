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
exports.Types = exports.Redis = void 0;
exports.getRedis = getRedis;
exports.initRedis = initRedis;
exports.getConnectionPerf = getConnectionPerf;
exports.closeRedis = closeRedis;
exports.closeAllRedis = closeAllRedis;
exports.clearAllKeys = clearAllKeys;
/* eslint-disable max-params */
// Import Node.js Dependencies
const node_events_1 = require("node:events");
const node_perf_hooks_1 = require("node:perf_hooks");
// Import Third-party Dependencies
const ioredis_1 = __importDefault(require("ioredis"));
var ioredis_2 = require("ioredis");
Object.defineProperty(exports, "Redis", { enumerable: true, get: function () { return ioredis_2.Redis; } });
// CONSTANTS
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;
let publisher;
let subscriber;
function getRedis(instance = "publisher") {
    const redis = instance === "publisher" ? publisher : subscriber;
    return redis;
}
/**
 *
 * Ensure the connection to the Redis instance.
 * @param {Redis} instance
 * @param {number} [attempt=4]
 */
async function assertConnection(instance, attempt = kDefaultAttempt, redis) {
    if (attempt <= 0) {
        throw new Error("Failed at initializing a Redis connection.");
    }
    const { isAlive } = await getConnectionPerf(instance, redis);
    if (!isAlive) {
        await assertConnection(instance, attempt - 1, redis);
    }
}
/**
* Init a redis connection.
* @param {object} redisOptions - represent object who contains all connections options
*
*/
async function initRedis(redisOptions = {}, instance = "publisher", external) {
    const { port, host } = redisOptions;
    const redis = typeof port !== "undefined" && typeof host !== "undefined" ?
        new ioredis_1.default(port, host, redisOptions) :
        new ioredis_1.default(redisOptions);
    if (external) {
        await assertConnection(instance, kDefaultAttempt, redis);
        return redis;
    }
    else if (instance === "publisher" && !publisher) {
        publisher = redis;
    }
    else if (instance === "subscriber" && !subscriber) {
        subscriber = redis;
    }
    await assertConnection(instance);
    return redis;
}
/**
 * Check Redis connection state.
 */
async function getConnectionPerf(instance = "publisher", redisInstance) {
    const redis = typeof redisInstance === "undefined" ? getRedis(instance) : redisInstance;
    if (!redis) {
        return { isAlive: false };
    }
    const start = node_perf_hooks_1.performance.now();
    try {
        await redis.ping();
    }
    catch {
        return { isAlive: false };
    }
    return { isAlive: true, perf: node_perf_hooks_1.performance.now() - start };
}
async function assertDisconnection(options) {
    const { redis, instance, attempt, forceExit, timeout } = {
        ...options,
        instance: undefined,
        attempt: options.attempt ?? kDefaultAttempt,
        forceExit: options.forceExit ?? false,
        timeout: options.timeout ?? kDefaultTimeout
    };
    if (attempt <= 0) {
        throw new Error("Failed at closing a Redis connection.");
    }
    setImmediate(() => {
        if (!forceExit) {
            redis.quit();
            return;
        }
        redis.disconnect();
    });
    try {
        await (0, node_events_1.once)(redis, "end", { signal: AbortSignal.timeout(timeout) });
    }
    catch {
        await assertDisconnection({
            redis,
            attempt: attempt - 1,
            forceExit,
            timeout
        });
    }
    const { isAlive } = await getConnectionPerf(instance, redis);
    if (isAlive) {
        await assertDisconnection({
            redis,
            attempt: attempt - 1,
            forceExit,
            timeout
        });
    }
}
/**
  * Close a single local connection.
  */
async function closeRedis(instance = "publisher", redisInstance, forceExit = false, timeout) {
    const isExt = typeof redisInstance !== "undefined";
    const redis = isExt ? redisInstance : getRedis(instance);
    if (!redis) {
        throw new Error("Unavailable redis instance");
    }
    await closeConnection(instance, redis, forceExit, timeout);
    if (!isExt) {
        if (instance === "publisher") {
            publisher = undefined;
        }
        else {
            subscriber = undefined;
        }
    }
}
/**
 * Close every redis connections.
 */
async function closeAllRedis(redisInstance, forceExit = false, timeout) {
    const instances = [...(typeof redisInstance === "undefined" ? [] : redisInstance), getRedis(), getRedis("subscriber")];
    await Promise.all(instances.map(async (instance) => {
        if (!instance) {
            return;
        }
        await closeConnection("publisher", instance, forceExit, timeout);
    }));
}
/**
  * Clear all keys from redis (it doesn't clean up streams).
  */
async function clearAllKeys(instance = "publisher", redis) {
    const redisInstance = typeof redis === "undefined" ? getRedis(instance) : redis;
    if (!redisInstance) {
        throw new Error("No available local instance");
    }
    await redisInstance.flushdb();
}
async function closeConnection(instance = "publisher", redis, forceExit = false, timeout) {
    const { isAlive } = await getConnectionPerf(instance, redis);
    if (!isAlive) {
        return;
    }
    await assertDisconnection({
        redis,
        forceExit,
        timeout
    });
}
__exportStar(require("./class/stream/index"), exports);
__exportStar(require("./class/pubSub/Channel.class"), exports);
__exportStar(require("./class/KVPeer.class"), exports);
__exportStar(require("./class/TimedKVPeer.class"), exports);
__exportStar(require("./class/RestrictedKV.class"), exports);
__exportStar(require("./class/StoreContext.class"), exports);
exports.Types = __importStar(require("./types/index"));
//# sourceMappingURL=index.js.map