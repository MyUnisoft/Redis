/// <reference types="node" />
import { KVPeer, KVOptions, SetValueOptions } from "./KVPeer.class";
import { KeyType } from "../types/index";
export interface TimedKVPeerOptions<T extends object, K extends Record<string, any> | null = null> extends Omit<KVOptions<T, K>, "type"> {
    /** How long the keys are kept, by default set to 10 minutes **/
    ttl?: number;
    /** A random key callback generator for setValue() method **/
    randomKeyCallback?: () => string;
}
interface TimedSetValueOptions<T> extends Omit<SetValueOptions<T>, "expiresIn" | "key"> {
    key?: string | Buffer;
}
/**
* @class TimedKVPeer
* @description TimedKVPeer represents an abstraction design to store time-lifed key-value peer. You probably don't need to use this class directly.
*/
export declare class TimedKVPeer<T extends object, K extends Record<string, any> | null = null> extends KVPeer<T, K> {
    protected randomKeyGenerator: () => string;
    private ttl;
    constructor(options?: TimedKVPeerOptions<T, K>);
    setValue(options: TimedSetValueOptions<T>): Promise<KeyType>;
}
export {};
