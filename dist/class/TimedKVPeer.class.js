"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimedKVPeer = void 0;
// Import Node.js Dependencies
const crypto_1 = require("crypto");
// Import Internal Dependencies
const KVPeer_class_1 = require("./KVPeer.class");
// CONSTANTS
const kDefaultTtl = 1000 * 60 * 10;
const kDefaultRandomKeyGenerator = () => (0, crypto_1.randomBytes)(6).toString("hex");
;
/**
* @class TimedKVPeer
* @description TimedKVPeer represents an abstraction design to store time-lifed key-value peer. You probably don't need to use this class directly.
*/
class TimedKVPeer extends KVPeer_class_1.KVPeer {
    constructor(options = {}) {
        super({ ...options, type: "object" });
        this.ttl = options.ttl ?? kDefaultTtl;
        this.randomKeyGenerator = options.randomKeyCallback ?? kDefaultRandomKeyGenerator;
    }
    async setValue(options) {
        const { key, value } = options;
        const finalKey = key ?? this.randomKeyGenerator();
        await super.setValue({ key: finalKey, value, expiresIn: this.ttl });
        return finalKey;
    }
}
exports.TimedKVPeer = TimedKVPeer;
//# sourceMappingURL=TimedKVPeer.class.js.map