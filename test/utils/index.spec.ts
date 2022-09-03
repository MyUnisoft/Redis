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

    expect(formatedStreamData).toStrictEqual(fullStreamData.formatedStreamData);
  });
});

describe("parseXINFOGroups", () => {
  it("should return a properly parsed object", () => {
    expect(utils.parseXINFOGroups(groupsData.groups)).toStrictEqual(groupsData.formatedGroups);
  });
});

describe("parseXINFOConsumers", () => {
  it("should return a properly parsed object", () => {
    expect(utils.parseXINFOConsumers(consumersData.consumers)).toStrictEqual(consumersData.formatedConsumers);
  });
});
