"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXINFOGroups = parseXINFOGroups;
// Import Internal Dependencies
const __1 = require("..");
function parseXINFOGroups(groups) {
    const formattedGroups = [];
    for (const group of groups) {
        const formattedGroup = {};
        for (const [key, value] of (0, __1.parseData)(group)) {
            formattedGroup[key] = value;
        }
        formattedGroups.push(formattedGroup);
    }
    return formattedGroups;
}
//# sourceMappingURL=groups.js.map