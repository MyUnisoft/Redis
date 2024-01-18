/// <reference types="node" />
import { EventEmitter } from "node:events";
import { KeyType } from "../types/index";
type CustomPackFn<T extends StringOrObject = Record<string, any>> = (value: Partial<T>) => Buffer;
type CustomUnpackFn<T extends StringOrObject = Record<string, any>> = (messagePack: Buffer | Uint8Array) => T;
export type KVType = "raw" | "object";
export type StringOrObject = string | Record<string, any>;
type IsMetadataDefined<T extends Record<string, any>, K extends Record<string, any> | null = null> = K extends Record<string, any> ? T & {
    customData: K;
} : T;
type MappedValue<T extends StringOrObject, K extends Record<string, any> | null = null> = T extends Record<string, any> ? IsMetadataDefined<T, K> : T;
export type KVMapper<T extends StringOrObject, K extends Record<string, any> | null = null> = (value: T) => MappedValue<T, K>;
export interface KVOptions<T extends StringOrObject = Record<string, any>, K extends Record<string, any> | null = null> {
    prefix?: string;
    type?: KVType;
    mapValue?: KVMapper<T, K>;
}
export interface SetValueOptions<T extends StringOrObject = Record<string, any>> {
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
* ```ts
* new KVPeer();
* new KVPeer({ prefix: "myPrefix" });
* ```
*/
export declare class KVPeer<T extends StringOrObject = StringOrObject, K extends Record<string, any> | null = null> extends EventEmitter {
    protected prefix: string;
    protected prefixedName: string;
    protected type: KVType;
    protected mapValue: KVMapper<T, K>;
    protected customPack: CustomPackFn<T>;
    protected customUnpack: CustomUnpackFn<T>;
    constructor(options?: KVOptions<T, K>);
    private defaultMapValue;
    get redis(): import("ioredis/built/Redis").default;
    setValue(options: SetValueOptions<T>): Promise<KeyType>;
    getValue(key: KeyType): Promise<MappedValue<T, K> | null>;
    deleteValue(key: KeyType): Promise<number>;
    private deepParse;
    private handlePackedOrMappedObject;
}
export {};
