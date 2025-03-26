// Import Internal Dependencies
export * from "./xinfo/groups.js";
export * from "./xinfo/consumers.js";
export * from "./xinfo/fullStream.js";
import type {
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

export type FormattedRedisOptions = [
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

export function* deepParseInput(input: Record<string, any> | any[]) {
  if (Array.isArray(input)) {
    for (const value of input) {
      if (typeof value === "object" && value !== null) {
        if (Buffer.isBuffer(value)) {
          yield value.toString();
        }
        else if (Array.isArray(value)) {
          yield [...deepParseInput(value)];
        }
        else {
          yield Object.fromEntries(deepParseInput(value));
        }
      }
      else {
        yield value;
      }
    }
  }
  else {
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "object" && value !== null) {
        if (Buffer.isBuffer(value)) {
          yield [key, value.toString()];
        }
        else if (Array.isArray(value)) {
          yield [key, [...deepParseInput(value)]];
        }
        else {
          yield [key, JSON.stringify(Object.fromEntries(deepParseInput(value)))];
        }
      }
      else {
        yield [key, value];
      }
    }
  }
}

export function parseInput(object: Record<string, unknown>) {
  return Object.fromEntries(deepParseInput(object));
}

export function parseOutput(object: Record<string, any>) {
  if (typeof object === "string") {
    if (!Number.isNaN(Number(object))) {
      return object;
    }
    else if (object === "false" || object === "true") {
      return object;
    }

    try {
      return parseOutput(JSON.parse(object));
    }
    catch {
      return object;
    }
  }

  if (Array.isArray(object)) {
    return object.map((val) => parseOutput(val));
  }

  if (typeof object === "object" && object !== null) {
    return Object.keys(object).reduce(
      (obj, key) => Object.assign(obj, {
        [key]: parseOutput(object[key])
      }), {}
    );
  }

  return object;
}
