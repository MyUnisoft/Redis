import { Stream, StreamOptions, ConsumeOptions } from "./Stream.class";
import * as utils from "../../utils/stream/index";
import { Entry } from "../../types/index";
export interface ClaimOptions {
    /**
     * Time given for which a claimed entry is idle
     */
    idleTime: number;
}
export interface InterpersonalOptions extends StreamOptions {
    groupName: string;
    consumerName: string;
    claimOptions?: ClaimOptions;
}
/**
 *
 * @description Abstraction of a Consumer (replication of a service) rattached to a Group (nature of a service)
 * to handle interpersonal communication through a redis stream
 */
export declare class Interpersonal extends Stream {
    consumerName: string;
    groupName: string;
    private claimOptions?;
    constructor(options: InterpersonalOptions);
    [Symbol.asyncIterator](): AsyncGenerator<Entry[], void, unknown>;
    init(): Promise<void>;
    consume(options?: ConsumeOptions): Promise<Entry[]>;
    claim(options: ClaimOptions): Promise<Entry[]>;
    claimEntry(entryId: string): Promise<void>;
    getConsumerData(): Promise<utils.XINFOConsumerData | undefined>;
    groupExist(): Promise<boolean>;
    createGroup(): Promise<void>;
    deleteGroup(): Promise<void>;
    consumerExist(): Promise<boolean>;
    createConsumer(): Promise<void>;
    deleteConsumer(): Promise<void>;
}
//# sourceMappingURL=Interpersonal.class.d.ts.map