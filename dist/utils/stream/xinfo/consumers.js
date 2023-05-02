"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXINFOConsumers = void 0;
// Import Internal Dependencies
const __1 = require("..");
function parseXINFOConsumers(consumers) {
    const formatedConsumers = [];
    for (const consumer of consumers) {
        const formatedConsumer = {};
        for (const [key, value] of (0, __1.parseData)(consumer)) {
            formatedConsumer[key] = value;
        }
        formatedConsumers.push(formatedConsumer);
    }
    return formatedConsumers;
}
exports.parseXINFOConsumers = parseXINFOConsumers;
//# sourceMappingURL=consumers.js.map