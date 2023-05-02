import { Stream, ConsumeOptions } from "./Stream.class";
import { Entry } from "../../types/index";
/**
 *
 * @description Handling intrapersonal communication through a redis stream
 */
export declare class Intrapersonal extends Stream {
    [Symbol.asyncIterator](): AsyncGenerator<Entry[], void, unknown>;
    consume(options?: ConsumeOptions): Promise<Entry[]>;
    cleanStream(): Promise<Entry[] | null>;
}
