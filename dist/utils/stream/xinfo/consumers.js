"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXINFOConsumers = parseXINFOConsumers;
// Import Internal Dependencies
const __1 = require("..");
function parseXINFOConsumers(consumers) {
    const formattedConsumers = [];
    for (const consumer of consumers) {
        const formattedConsumer = {};
        for (const [key, value] of (0, __1.parseData)(consumer)) {
            formattedConsumer[key] = value;
        }
        formattedConsumers.push(formattedConsumer);
    }
    return formattedConsumers;
}
//# sourceMappingURL=consumers.js.map