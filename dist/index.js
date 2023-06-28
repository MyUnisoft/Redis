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
exports.Types = exports.clearAllKeys = exports.closeAllRedis = exports.closeRedis = exports.getConnectionPerf = exports.initRedis = exports.getSubscriber = exports.getPublisher = void 0;
// Import Node.js Dependencies
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
// Import Third-party Dependencies
const ioredis_1 = __importDefault(require("ioredis"));
let publisher;
let subscriber;
function getPublisher() {
    return publisher;
}
exports.getPublisher = getPublisher;
function getSubscriber() {
    return subscriber;
}
exports.getSubscriber = getSubscriber;
/**
 *
 * Ensure the connection to the Redis instance.
 * @param {Redis} instance
 * @param {number} [attempt=4]
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
* Init a redis connection.
* @param {object} redisOptions - represent object who contains all connections options
*
*/
async function initRedis(redisOptions = {}, initSubscriber) {
    const { port, host, password } = redisOptions;
    const redis = typeof port !== "undefined" && typeof host !== "undefined" ?
        new ioredis_1.default(port, host, { password }) :
        new ioredis_1.default({ password });
    await assertConnection(redis);
    if (initSubscriber) {
        subscriber = redis;
    }
    else {
        publisher = redis;
    }
    return redis;
}
exports.initRedis = initRedis;
/**
 * Check Redis connection state.
 */
async function getConnectionPerf(extInstance) {
    const redis = extInstance ?? publisher;
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
  * Close a single local connection.
  */
async function closeRedis(isSubscriber = false) {
    const redis = isSubscriber ? subscriber : publisher;
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
/**
 * Close every redis connections.
 */
async function closeAllRedis() {
    const instances = [publisher, subscriber];
    await Promise.all(instances.map(async (instance) => {
        const { isAlive } = await getConnectionPerf(instance);
        if (!isAlive) {
            return;
        }
        setImmediate(() => {
            instance.quit();
        });
        await (0, events_1.once)(instance, "end");
    }));
}
exports.closeAllRedis = closeAllRedis;
/**
  * Clear all keys from redis (it doesn't clean up streams or pubsub).
  */
async function clearAllKeys(isSubscriber = false) {
    const redis = isSubscriber ? subscriber : publisher;
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