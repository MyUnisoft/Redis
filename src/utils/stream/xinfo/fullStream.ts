// Import Internal Dependencies
import {
  kParseRegex,
  type XRedisData,
  type XEntries,
  type XEntry,
  type XPending,
  type XConsumers,
  type XGroups
} from "../index.js";
import type {
  Group,
  Consumer,
  Entry,
  Pending,
  Value
} from "../../../types/index.js";

export function* parseFullStreamData(arr: XRedisData): IterableIterator<
  Array<string | Value |
  Entry[] | Consumer[] | Group[] | Pending[]>
> {
  while (arr.length > 0) {
    let curr = arr[0] as string;
    const next = arr[1];

    arr.splice(0, 2);

    // Rewrite key to camelCase
    while (kParseRegex.test(curr)) {
      const matches = curr.match(kParseRegex);

      if (matches) {
        curr = curr.replace(matches[0], matches[1].toUpperCase());
      }
    }

    switch (curr) {
      case "entries":
        yield [curr as string, parseEntries(next as XEntries)];
        break;
      case "groups":
        yield [curr as string, parseGroups(next as XGroups)];
        break;
      case "pending":
        yield [curr as string, parsePendings(next as XPending)];
        break;
      case "consumers":
        yield [curr as string, parseConsumers(next as XConsumers)];
        break;
      default:
        yield [curr as string, next as Value];
        break;
    }
  }
}

function parsePendings(pendings: XPending): Pending[] {
  const formattedPendings: Pending[] = [];

  for (const pending of pendings) {
    if (pending.length === 4) {
      formattedPendings.push({
        id: pending[0] as string,
        consumerName: pending[1] as string,
        idleTime: pending[2] as number,
        unknown: pending[3] as number
      });
    }
    else {
      formattedPendings.push({
        id: pending[0] as string,
        idleTime: pending[1] as number,
        unknown: pending[2] as number
      });
    }
  }

  return formattedPendings;
}

export function parseEntries(entries: XEntries): Entry[] {
  const formattedEntries: Entry[] = [];

  for (const entry of entries) {
    const formattedEntry = {
      id: "",
      data: {}
    };

    formattedEntry.id = entry[0] as string;
    entry.splice(0, 1);

    for (const [key, value] of parseEntryData(entry.flat())) {
      formattedEntry.data[key as string] = value;
    }

    formattedEntries.push(formattedEntry);
  }

  return formattedEntries;
}

function* parseEntryData(entry: XEntry) {
  while (entry.length > 0) {
    const key = entry[0] as string;
    const value = entry[1];

    entry.splice(0, 2);

    yield [key, value];
  }
}

export function parseConsumers(consumers: XConsumers): Consumer[] {
  const formattedConsumers: Consumer[] = [];

  for (const consumer of consumers) {
    const formattedConsumer = {};

    for (const [key, value] of parseFullStreamData(consumer)) {
      formattedConsumer[key as string] = value;
    }

    formattedConsumers.push(formattedConsumer as Consumer);
  }

  return formattedConsumers;
}

export function parseGroups(groups: XGroups): Group[] {
  const formattedGroups: Group[] = [];

  for (const group of groups) {
    const formattedGroup = {};

    for (const [key, value] of parseFullStreamData(group)) {
      formattedGroup[key as string] = value;
    }

    formattedGroups.push(formattedGroup as Group);
  }

  return formattedGroups;
}
