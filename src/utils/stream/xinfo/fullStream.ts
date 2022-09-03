// Import Internal Dependencies
import {
  kParseRegex,
  XRedisData,
  XEntries,
  XEntry,
  XPending,
  XConsumers,
  XGroups
} from "../index";

// Import Types
import {
  Group,
  Consumer,
  Entry,
  Pending,
  Value
} from "../../../types/index";

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
  const formatedPendings: Pending[] = [];

  for (const pending of pendings) {
    if (pending.length === 4) {
      formatedPendings.push({
        id: pending[0] as string,
        consumerName: pending[1] as string,
        idleTime: pending[2] as number,
        unknow: pending[3] as number
      });
    }
    else {
      formatedPendings.push({
        id: pending[0] as string,
        idleTime: pending[1] as number,
        unknow: pending[2] as number
      });
    }
  }

  return formatedPendings;
}

export function parseEntries(entries: XEntries): Entry[] {
  const formatedEntries: Entry[] = [];

  for (const entry of entries) {
    const formatedEntry = {
      id: "",
      data: {}
    };

    formatedEntry.id = entry[0] as string;
    entry.splice(0, 1);

    for (const [key, value] of parseEntryData(entry.flat())) {
      formatedEntry.data[key as string] = value;
    }

    formatedEntries.push(formatedEntry);
  }

  return formatedEntries;
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
  const formatedConsumers: Consumer[] = [];

  for (const consumer of consumers) {
    const formatedConsumer = {};

    for (const [key, value] of parseFullStreamData(consumer)) {
      formatedConsumer[key as string] = value;
    }

    formatedConsumers.push(formatedConsumer as Consumer);
  }

  return formatedConsumers;
}

export function parseGroups(groups: XGroups): Group[] {
  const formatedGroups: Group[] = [];

  for (const group of groups) {
    const formatedGroup = {};

    for (const [key, value] of parseFullStreamData(group)) {
      formatedGroup[key as string] = value;
    }

    formatedGroups.push(formatedGroup as Group);
  }

  return formatedGroups;
}
