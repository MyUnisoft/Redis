// Import Internal Dependencies
import { parseData } from "..";

export type XINFOGroups = (string | number)[][];

export interface XINFOGroupData {
  name: string;
  consumers: number;
  pending: number;
  lastDeliveredId: string;
}

export function parseXINFOGroups(groups: XINFOGroups): XINFOGroupData[] {
  const formatedGroups: XINFOGroupData[] = [];

  for (const group of groups) {
    const formatedGroup = {};

    for (const [key, value] of parseData(group)) {
      formatedGroup[key as string] = value;
    }

    formatedGroups.push(formatedGroup as XINFOGroupData);
  }

  return formatedGroups;
}
