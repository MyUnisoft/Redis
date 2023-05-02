"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXINFOGroups = void 0;
// Import Internal Dependencies
const __1 = require("..");
function parseXINFOGroups(groups) {
    const formatedGroups = [];
    for (const group of groups) {
        const formatedGroup = {};
        for (const [key, value] of (0, __1.parseData)(group)) {
            formatedGroup[key] = value;
        }
        formatedGroups.push(formatedGroup);
    }
    return formatedGroups;
}
exports.parseXINFOGroups = parseXINFOGroups;
//# sourceMappingURL=groups.js.map