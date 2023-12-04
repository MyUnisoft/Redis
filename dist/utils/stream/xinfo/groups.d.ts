export type XINFOGroups = (string | number)[][];
export interface XINFOGroupData {
    name: string;
    consumers: number;
    pending: number;
    lastDeliveredId: string;
}
export declare function parseXINFOGroups(groups: XINFOGroups): XINFOGroupData[];
