"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGroups = exports.parseConsumers = exports.parseEntries = exports.parseFullStreamData = void 0;
// Import Internal Dependencies
const index_1 = require("../index");
function* parseFullStreamData(arr) {
    while (arr.length > 0) {
        let curr = arr[0];
        const next = arr[1];
        arr.splice(0, 2);
        // Rewrite key to camelCase
        while (index_1.kParseRegex.test(curr)) {
            const matches = curr.match(index_1.kParseRegex);
            if (matches) {
                curr = curr.replace(matches[0], matches[1].toUpperCase());
            }
        }
        switch (curr) {
            case "entries":
                yield [curr, parseEntries(next)];
                break;
            case "groups":
                yield [curr, parseGroups(next)];
                break;
            case "pending":
                yield [curr, parsePendings(next)];
                break;
            case "consumers":
                yield [curr, parseConsumers(next)];
                break;
            default:
                yield [curr, next];
                break;
        }
    }
}
exports.parseFullStreamData = parseFullStreamData;
function parsePendings(pendings) {
    const formatedPendings = [];
    for (const pending of pendings) {
        if (pending.length === 4) {
            formatedPendings.push({
                id: pending[0],
                consumerName: pending[1],
                idleTime: pending[2],
                unknow: pending[3]
            });
        }
        else {
            formatedPendings.push({
                id: pending[0],
                idleTime: pending[1],
                unknow: pending[2]
            });
        }
    }
    return formatedPendings;
}
function parseEntries(entries) {
    const formatedEntries = [];
    for (const entry of entries) {
        const formatedEntry = {
            id: "",
            data: {}
        };
        formatedEntry.id = entry[0];
        entry.splice(0, 1);
        for (const [key, value] of parseEntryData(entry.flat())) {
            formatedEntry.data[key] = value;
        }
        formatedEntries.push(formatedEntry);
    }
    return formatedEntries;
}
exports.parseEntries = parseEntries;
function* parseEntryData(entry) {
    while (entry.length > 0) {
        const key = entry[0];
        const value = entry[1];
        entry.splice(0, 2);
        yield [key, value];
    }
}
function parseConsumers(consumers) {
    const formatedConsumers = [];
    for (const consumer of consumers) {
        const formatedConsumer = {};
        for (const [key, value] of parseFullStreamData(consumer)) {
            formatedConsumer[key] = value;
        }
        formatedConsumers.push(formatedConsumer);
    }
    return formatedConsumers;
}
exports.parseConsumers = parseConsumers;
function parseGroups(groups) {
    const formatedGroups = [];
    for (const group of groups) {
        const formatedGroup = {};
        for (const [key, value] of parseFullStreamData(group)) {
            formatedGroup[key] = value;
        }
        formatedGroups.push(formatedGroup);
    }
    return formatedGroups;
}
exports.parseGroups = parseGroups;
//# sourceMappingURL=fullStream.js.map