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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisOptions = exports.parseData = exports.kParseRegex = void 0;
// Import Internal Dependencies
__exportStar(require("./xinfo/groups"), exports);
__exportStar(require("./xinfo/consumers"), exports);
__exportStar(require("./xinfo/fullStream"), exports);
// CONSTANTS
exports.kParseRegex = new RegExp("-([a-zA-Z])");
function* parseData(arr) {
    while (arr.length > 0) {
        let curr = arr[0];
        const next = arr[1];
        arr.splice(0, 2);
        // Rewrite key to camelCase
        while (exports.kParseRegex.test(curr)) {
            const matches = curr.match(exports.kParseRegex);
            if (matches) {
                curr = curr.replace(matches[0], matches[1].toUpperCase());
            }
        }
        yield [curr, next];
    }
}
exports.parseData = parseData;
function* createRedisOptions(...options) {
    for (const args of options) {
        if (typeof args === "object") {
            for (const [key, value] of Object.entries(args)) {
                if (value === undefined) {
                    continue;
                }
                yield* [key.toUpperCase(), value];
            }
        }
        else {
            if (args === undefined) {
                continue;
            }
            yield args;
        }
    }
}
exports.createRedisOptions = createRedisOptions;
//# sourceMappingURL=index.js.map