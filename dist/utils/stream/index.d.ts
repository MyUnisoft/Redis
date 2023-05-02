export * from "./xinfo/groups";
export * from "./xinfo/consumers";
export * from "./xinfo/fullStream";
import { Entry, Value, Consumer, Group, Pending } from "../../types/index";
export declare const kParseRegex: RegExp;
export declare type XEntries = ((string | (Value)[])[])[];
export declare type XEntry = (string | (Value))[];
export declare type XPending = (Value)[][];
export declare type XConsumers = (string | (Value)[][])[][][];
export declare type XConsumer = (string | Value[][])[][];
export declare type XGroups = XGroup[];
export declare type XGroup = (string | Value | (Value | Value[][])[][])[];
export declare type XRedisData<T = ((string | Value) | ((string | Value)[] | Value | XPending)[][] | XGroups | (string | Value[][])[])[][]> = T extends (infer R)[] ? R : T;
export declare function parseData(arr: XRedisData): IterableIterator<Array<string | Value | Entry[] | Consumer[] | Group[] | Pending[]>>;
declare type RedisArgs = "stream" | "count" | "streams" | "group";
declare type RedisOptions = {
    [P in RedisArgs]?: (string | number) | undefined;
};
export declare type FormatedRedisOptions = [
    string,
    (string | number),
    (string | number)
];
export declare function createRedisOptions(...options: (((string | number) | undefined) | RedisOptions)[]): IterableIterator<(string | number) | (string | number)[]>;
