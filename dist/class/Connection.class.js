"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
// Import Node.js Dependencies
const node_events_1 = require("node:events");
const node_perf_hooks_1 = require("node:perf_hooks");
// Import Third-Party Dependencies
const ioredis_1 = require("ioredis");
const result_1 = require("@openally/result");
// CONSTANTS
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;
class Connection extends ioredis_1.Redis {
    #attempt;
    #disconnectionTimeout;
    constructor(options) {
        const { port, host, password } = options;
        if (typeof port !== "undefined" && typeof host !== "undefined") {
            super(port, host, { password });
        }
        else {
            super({ password });
        }
        this.#attempt = options.attempt ?? kDefaultAttempt;
        this.#disconnectionTimeout = options.disconnectionTimeout ?? kDefaultTimeout;
    }
    async initialize() {
        await this.assertConnection();
    }
    async getConnectionPerf() {
        const start = node_perf_hooks_1.performance.now();
        try {
            await this.ping();
        }
        catch {
            return { isAlive: false };
        }
        return { isAlive: true, perf: node_perf_hooks_1.performance.now() - start };
    }
    async close(forceExit = false) {
        const { isAlive } = await this.getConnectionPerf();
        if (!isAlive) {
            return (0, result_1.Err)("Redis connection already closed");
        }
        await this.assertDisconnection(forceExit);
        return (0, result_1.Ok)(null);
    }
    async assertConnection(attempt = this.#attempt) {
        if (attempt <= 0) {
            return (0, result_1.Err)("Failed at initializing the Redis connection");
        }
        const { isAlive } = await this.getConnectionPerf();
        if (!isAlive) {
            await this.assertConnection(attempt - 1);
        }
        return (0, result_1.Ok)(null);
    }
    async assertDisconnection(forceExit, attempt = this.#attempt) {
        if (attempt <= 0) {
            return (0, result_1.Err)("Failed at closing the Redis connection");
        }
        if (forceExit) {
            this.disconnect();
        }
        else {
            this.quit();
        }
        try {
            await (0, node_events_1.once)(this, "end", {
                signal: AbortSignal.timeout(this.#disconnectionTimeout)
            });
        }
        catch {
            await this.assertDisconnection(forceExit, attempt - 1);
        }
        return (0, result_1.Ok)(null);
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.class.js.map