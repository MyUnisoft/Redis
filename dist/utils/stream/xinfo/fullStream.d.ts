import { XRedisData, XEntries, XConsumers, XGroups } from "../index";
import { Group, Consumer, Entry, Pending, Value } from "../../../types/index";
export declare function parseFullStreamData(arr: XRedisData): IterableIterator<Array<string | Value | Entry[] | Consumer[] | Group[] | Pending[]>>;
export declare function parseEntries(entries: XEntries): Entry[];
export declare function parseConsumers(consumers: XConsumers): Consumer[];
export declare function parseGroups(groups: XGroups): Group[];
//# sourceMappingURL=fullStream.d.ts.map