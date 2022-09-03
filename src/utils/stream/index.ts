// Import Internal Dependencies
export * from "./xinfo/groups";
export * from "./xinfo/consumers";
export * from "./xinfo/fullStream";

// Import Types
import {
  Entry,
  Value,
  Consumer,
  Group,
  Pending
} from "../../types/index";

// CONSTANTS
export const kParseRegex = new RegExp("-([a-zA-Z])");

// Ref https://redis.io/commands/xinfo
export type XEntries = ((string | (Value)[])[])[];
export type XEntry = (string | (Value))[];
export type XPending = (Value)[][];
export type XConsumers = (string | (Value)[][])[][][];
export type XConsumer = (string | Value[][])[][];
export type XGroups = XGroup[];
export type XGroup = (string | Value | (Value | Value[][])[][])[];
export type XRedisData<T = (
    (string | Value) |
    (
      (string | Value)[] | Value | XPending
    )[][] |
    XGroups |
    (string | Value[][])[]
  )[][]> = T extends (infer R)[] ? R : T;

export function* parseData(arr: XRedisData):
IterableIterator<
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

    yield [curr as string, next as Value];
  }
}

type RedisArgs = "stream" | "count" | "streams" | "group";
type RedisOptions = { [P in RedisArgs]?: (string | number) | undefined };

export type FormatedRedisOptions = [
  string,
  (string | number),
  (string | number)
];

export function* createRedisOptions(...options: (((string | number) | undefined) | RedisOptions)[]):
IterableIterator<(string | number) | (string | number)[]> {
  for (const args of options) {
    if (typeof args === "object") {
      for (const [key, value] of Object.entries(args)) {
        if (value === undefined) {
          continue;
        }

        yield* [key.toUpperCase(), value];
      }
    }
    else {
      if (args === undefined) {
        continue;
      }

      yield args;
    }
  }
}
