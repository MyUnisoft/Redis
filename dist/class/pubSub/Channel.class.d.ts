import { Redis } from "ioredis";
export interface ChannelOptions {
    name: string;
    prefix?: string;
}
export declare type MessageWithMetadata<T, K> = T & {
    metadata: K;
};
export declare type PublishOptions<T extends Record<string, any> = Record<string, any>, K extends Record<string, any> | null = null> = K extends null ? (T | T[]) : (MessageWithMetadata<T, K> | MessageWithMetadata<T, K>[]);
export declare class Channel<T extends Record<string, any> = Record<string, any>, K extends Record<string, any> | null = null> {
    readonly name: string;
    readonly redis: Redis;
    constructor(options: ChannelOptions, redis?: Redis);
    publish(options: PublishOptions<T, K>): Promise<void>;
}