"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFullStreamData = parseFullStreamData;
exports.parseEntries = parseEntries;
exports.parseConsumers = parseConsumers;
exports.parseGroups = parseGroups;
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
function parsePendings(pendings) {
    const formattedPendings = [];
    for (const pending of pendings) {
        if (pending.length === 4) {
            formattedPendings.push({
                id: pending[0],
                consumerName: pending[1],
                idleTime: pending[2],
                unknown: pending[3]
            });
        }
        else {
            formattedPendings.push({
                id: pending[0],
                idleTime: pending[1],
                unknown: pending[2]
            });
        }
    }
    return formattedPendings;
}
function parseEntries(entries) {
    const formattedEntries = [];
    for (const entry of entries) {
        const formattedEntry = {
            id: "",
            data: {}
        };
        formattedEntry.id = entry[0];
        entry.splice(0, 1);
        for (const [key, value] of parseEntryData(entry.flat())) {
            formattedEntry.data[key] = value;
        }
        formattedEntries.push(formattedEntry);
    }
    return formattedEntries;
}
function* parseEntryData(entry) {
    while (entry.length > 0) {
        const key = entry[0];
        const value = entry[1];
        entry.splice(0, 2);
        yield [key, value];
    }
}
function parseConsumers(consumers) {
    const formattedConsumers = [];
    for (const consumer of consumers) {
        const formattedConsumer = {};
        for (const [key, value] of parseFullStreamData(consumer)) {
            formattedConsumer[key] = value;
        }
        formattedConsumers.push(formattedConsumer);
    }
    return formattedConsumers;
}
function parseGroups(groups) {
    const formattedGroups = [];
    for (const group of groups) {
        const formattedGroup = {};
        for (const [key, value] of parseFullStreamData(group)) {
            formattedGroup[key] = value;
        }
        formattedGroups.push(formattedGroup);
    }
    return formattedGroups;
}
//# sourceMappingURL=fullStream.js.map