import { KVPeer, KVOptions } from "./KVPeer.class";
import { KeyType } from "../types/index";
export declare type RestrictedKVOptions = Pick<KVOptions<Attempt>, "prefix"> & {
    autoClearExpired?: number;
    allowedAttempt?: number;
    banTimeInSecond?: number;
};
export interface Attempt {
    failure: number;
    lastTry: number;
    locked: boolean;
}
export declare type RawAttempt = Record<keyof Attempt, string>;
/**
* @class RestrictedKV
* @classdesc Implementation to prevent brute force attacks.
*/
export declare class RestrictedKV extends KVPeer<Partial<Attempt>> {
    private autoClearInterval;
    protected allowedAttempt: number;
    protected banTimeInSecond: number;
    static getDefaultAttempt(): {
        failure: number;
        lastTry: number;
        locked: boolean;
    };
    constructor(options?: RestrictedKVOptions);
    private parseRawAttempt;
    clearAutoClearInterval(): void;
    /**
     * @description Returns the number of attempts (failure, last tentative timestamp ...) for a given key
     *
     * @param key - key WITHOUT PREFIX
     *
     * @example handler.getAttempt("myKey")
     */
    getAttempt(key: KeyType): Promise<Attempt>;
    /**
    * @description Increment an access failure for a given key.
    * The method also allows to define whether a key is locked or not (when the number of failures exceeds the defined limitation).
    *
    * @param key - key WITHOUT PREFIX
    *
    * @example handler.fail("myKey")
    */
    fail(key: KeyType): Promise<Attempt>;
    /**
    * @description Notify a successful access for a given key. This will remove all traces of previous failed access.
    *
    * @param key - WITHOUT PREFIX
    *
    * @example handler.success("email@domain.com")
    */
    success(key: KeyType): Promise<void>;
    /**
    * @description Searches for all keys where the last attempt exceeds an allocated lifetime and clear (delete) them.
    *
    * @example handler.clearExpired()
    */
    clearExpired(): Promise<void>;
    private isKeyExpired;
}
