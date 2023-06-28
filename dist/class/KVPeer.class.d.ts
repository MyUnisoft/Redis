/// <reference types="node" />
import { EventEmitter } from "events";
import { Redis } from "ioredis";
import { KeyType } from "../types/index";
export declare type KVType = "raw" | "object";
export declare type StringOrObject = string | Record<string, any>;
declare type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> = K extends Record<string, any> ? T & {
    customData: K;
} : T;
declare type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ? IsMetadataDefined<T, K> : T;
export declare type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;
export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
    prefix?: string;
    type?: KVType;
    mapValue?: KVMapper<T, K>;
}
export interface SetValueOptions<T> {
    key: KeyType;
    value: Partial<T>;
    expiresIn?: number;
}
/**
* @class KVPeer
* @extends EventEmitter
* @description This class is used to store and retrieve key-value peers in Redis.
*
* @property {Redis} redis - Instance of Redis connection
* @property {string} [prefix = ""] - prefix for keys
*
* @example
* new KVPeer();
* new KVPeer({ prefix: "myPrefix" });
*/
export declare class KVPeer<T extends StringOrObject = StringOrObject, K extends Record<string, any> | null = null> extends EventEmitter {
    protected prefix: string;
    protected prefixedName: string;
    protected type: KVType;
    protected mapValue: KVMapper<T, K>;
    constructor(options?: KVOptions<T, K>);
    private defaultMapValue;
    get redis(): Redis;
    setValue(options: SetValueOptions<T>): Promise<KeyType>;
    getValue(key: KeyType): Promise<MappedValue<T, K> | null>;
    deleteValue(key: KeyType): Promise<number>;
}
export {};
