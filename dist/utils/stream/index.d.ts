export * from "./xinfo/groups";
export * from "./xinfo/consumers";
export * from "./xinfo/fullStream";
import { Entry, Value, Consumer, Group, Pending } from "../../types/index";
export declare const kParseRegex: RegExp;
export type XEntries = ((string | (Value)[])[])[];
export type XEntry = (string | (Value))[];
export type XPending = (Value)[][];
export type XConsumers = (string | (Value)[][])[][][];
export type XConsumer = (string | Value[][])[][];
export type XGroups = XGroup[];
export type XGroup = (string | Value | (Value | Value[][])[][])[];
export type XRedisData<T = ((string | Value) | ((string | Value)[] | Value | XPending)[][] | XGroups | (string | Value[][])[])[][]> = T extends (infer R)[] ? R : T;
export declare function parseData(arr: XRedisData): IterableIterator<Array<string | Value | Entry[] | Consumer[] | Group[] | Pending[]>>;
type RedisArgs = "stream" | "count" | "streams" | "group";
type RedisOptions = {
    [P in RedisArgs]?: (string | number) | undefined;
};
export type FormattedRedisOptions = [
    string,
    (string | number),
    (string | number)
];
export declare function createRedisOptions(...options: (((string | number) | undefined) | RedisOptions)[]): IterableIterator<(string | number) | (string | number)[]>;
