export type XINFOConsumers = (string | number)[][];
export interface XINFOConsumerData {
    name: string;
    pending: number;
    idle: number;
}
export declare function parseXINFOConsumers(consumers: XINFOConsumers): XINFOConsumerData[];
