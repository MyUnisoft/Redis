import { EventEmitter } from "node:events";
import * as utils from "../../utils/stream/index";
import { Data, Entry, Group } from "../../types/index";
export interface StreamOptions {
    streamName: string;
    /**
     * Interval of time between two iteration on the stream
     */
    frequency: number;
    /**
     * Reference to the minimal ID we iterate from
     */
    lastId?: string;
    /**
     * Number of entries it must pull at each iteration
     */
    count?: number;
}
export interface GetRangeOptions {
    /**
     * Reference to the minimal ID we pull from
     */
    min: string;
    /**
     * Reference to the maximal ID we pull to
     */
    max: string;
    /**
     * Number of max entries pulled out
     */
    count?: number;
}
export interface XINFOStreamData {
    length: number;
    radixTreeKeys: number;
    radixTreeNodes: number;
    lastGeneratedId: string;
    entries: Entry[];
    groups?: Group[];
}
export interface ConsumeOptions {
    lastId: string;
    count?: number;
    block?: number;
}
export interface PushOptions {
    id?: string;
    metadata?: string;
}
/**
 *
 * @description Shared method used to work on a Redis Stream
 */
export declare class Stream extends EventEmitter {
    streamName: string;
    lastId: string;
    protected frequency: number;
    protected count?: number;
    constructor(options: StreamOptions);
    get redis(): import("ioredis").default;
    streamExist(): Promise<boolean>;
    /**
     *
     * @description In order to create a new Redis stream, we must push a first entry
     */
    init(): Promise<void>;
    getInfo(): Promise<XINFOStreamData>;
    getLength(): Promise<number>;
    getGroupsData(): Promise<utils.XINFOGroupData[]>;
    /**
     *
     * @description Push a new entry on the stream, if no ID provided, use the special ID "*".
     * Using the special ID "*", Redis generate IDs as follow 1526985685298-0, the first part
     * being a timestamp, and the second an increment.
     * @param {data: { key: string; value: string | Buffer | number }, options: { id?: string; metadata?: string }} [options]
     * @returns {Promise<string>}
     * @example
     * ```ts
     * // Push an Entry with a custom ID
     * const entryId = await push({ foo: "bar" }, { id: "any-custom-id" });
     * console.log(entryId) // "any-custom-string"
     * ```
     * @example
     * ```ts
     * // Push an Entry without a custom ID
     * const entryId = await push({ foo: "bar" }, { metadata: "" });
     * console.log(entryId) // 1526985685298-0
     * ```
     */
    push(data: Data, options?: PushOptions): Promise<string>;
    delEntry(entryId: string): Promise<void>;
    handleEntries(entries: utils.XEntries, cursor?: string): Promise<Entry[]>;
    /**
     *
     * @description Return a range of elements in a stream, with IDs matching the specified IDs interval.
     * @param {{ min: string; max: string; count?: number; }} [options={ min: "-", max: "+" }]
     * @returns {Promise<Entry[]>}
     * @example
     * ```ts
     * // Return all entries
     * await getRange({ min: "-", max: "+" })
     * ```
     * @example
     * ```ts
     * // Return single Entry
     * await getRange({ min: "1526985685298-0", max: "1526985685298-0" })
     * ```
     * @example
     * ```ts
     * // Return entries between those timestamp (inclusive)
     * await getRange({ min: "1526985054069", max: "1526985055069"})
     * ```
     * @example
     * ```ts
     * // Return Entry with id 1526985676425-0 & 1526985685298-0
     * await getRange({ min: "-", max: "+", count: 2})
     * // Return two next Entry, "(" exluding the given id
     * await getRange({ min: "(1526985685298-0", max: "+", count: 2 })
     * ```
     */
    getRange(options?: GetRangeOptions): Promise<Entry[]>;
    /**
     *
     * @description Return a range of elements in a stream, with IDs matching the specified IDs interval,
     * in reverse order (from greater to smaller IDs).
     * @param {{ min: string; max: string; count?: number; }} [options={ min: "-", max: "+" }]
     * @returns {Promise<Entry[]>}
     * @example
     * ```ts
     * // Return all entries
     * await getRevRange({ min: "-", max: "+" })
     * ```
     * @example
     * ```ts
     * // Return single Entry
     * await getRevRange({ min: "1526985685298-0", max: "1526985685298-0" })
     * ```
     * @example
     * ```ts
     * // Return entries between those timestamp (inclusive)
     * await getRevRange({ min: "1526985054069", max: "1526985055069"})
     * ```
     * @example
     * ```ts
     * // Return Entry with id 1526985676425-0 & 1526985685298-0
     * await getRevRange({ min: "-", max: "+", count: 2})
     * // Return two next Entry, "(" exluding the given id
     * await getRevRange({ min: "(1526985685298-0", max: "+", count: 2 })
     * ```
     */
    getRevRange(options?: GetRangeOptions): Promise<Entry[]>;
    /**
     *
     * @description Trim the stream, if the threshold is a number, then it is considered as a max-length,
     * if the threshold is a string, then it is considered as a reference to an ID/Timestamp.
     * @param {(number | string)} threshold
     * @returns {Promise<number>}
     * @example
     * ```ts
     * // Given a number, it acts like a max-lenght
     * for (let index = 0; index < 1000; index++) await push({ data: { key: "foo", value: "bar" }})
     * const nbEvictedEntry = await trim(900)
     * console.log(nbEvictedEntry) // 100
     * ```
     */
    trim(threshold: number | string): Promise<number>;
    /**
     *
     * @description Check whenever a given group exist for the initialized Stream.
     * @param {string} name
     * @returns {Promise<boolean>}
     */
    groupExist(name: string): Promise<boolean>;
    /**
     *
     * @description Create a new group related to the initialized Stream.
     * @param {string} name
     */
    createGroup(name: string): Promise<void>;
    /**
     *
     * @description Delete a group related to the initialized Stream.
     * @param {string} name
     */
    deleteGroup(name: string): Promise<void>;
    /**
     *
     * @description Return Consumer data for a given group related to the initialized Stream.
     * @param {string} groupName
     * @param {string} consumerName
     * @returns {Promise<utils.XINFOConsumerData | undefined>}
     */
    getConsumerData(groupName: string, consumerName: string): Promise<utils.XINFOConsumerData | undefined>;
    /**
     *
     * @description Check whenever a consumer exist for a given group related to the initialized Stream.
     * @param {string} groupName
     * @param {string} consumerName
     * @returns {Promise<boolean>}
     */
    consumerExist(groupName: string, consumerName: string): Promise<boolean>;
    /**
     *
     * @description Create a new consumer for a given group related to the initialized Stream.
     * @param {string} groupName
     * @param {string} consumerName
     */
    createConsumer(groupName: string, consumerName: string): Promise<void>;
    /**
     *
     * @description Delete a consumer for a given group related to the initialized Stream.
     * @param {string} groupName
     * @param {string} consumerName
     */
    deleteConsumer(groupName: string, consumerName: string): Promise<void>;
}
//# sourceMappingURL=Stream.class.d.ts.map