// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, before, it } from "node:test";

// Import Internal Dependencies
import * as utils from "../../src/utils/stream/index";
import * as fullStreamData from "../fixtures/xinfo/fullStream";
import * as groupsData from "../fixtures/xinfo/groups";
import * as consumersData from "../fixtures/xinfo/consumers";

describe("parseFullStreamData", () => {
  it("should return a properly parsed object", () => {
    const formatedStreamData = {};

    for (const [key, value] of utils.parseFullStreamData(fullStreamData.streamData)) {
      formatedStreamData[key as string] = value;
    }

    assert.deepEqual(formatedStreamData, fullStreamData.formatedStreamData);
  });
});

describe("parseXINFOGroups", () => {
  it("should return a properly parsed object", () => {
    assert.deepEqual(utils.parseXINFOGroups(groupsData.groups), groupsData.formatedGroups);
  });
});

describe("parseXINFOConsumers", () => {
  it("should return a properly parsed object", () => {
    assert.deepEqual(utils.parseXINFOConsumers(consumersData.consumers), consumersData.formatedConsumers);
  });
});
