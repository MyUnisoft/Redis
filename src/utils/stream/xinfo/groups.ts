// Import Internal Dependencies
import { parseData } from "../index.js";

export type XINFOGroups = (string | number)[][];

export interface XINFOGroupData {
  name: string;
  consumers: number;
  pending: number;
  lastDeliveredId: string;
}

export function parseXINFOGroups(groups: XINFOGroups): XINFOGroupData[] {
  const formattedGroups: XINFOGroupData[] = [];

  for (const group of groups) {
    const formattedGroup = {};

    for (const [key, value] of parseData(group)) {
      formattedGroup[key as string] = value;
    }

    formattedGroups.push(formattedGroup as XINFOGroupData);
  }

  return formattedGroups;
}
