import { TimedKVPeer, TimedKVPeerOptions } from "./TimedKVPeer.class";
export interface CookieSerializeOptions {
    domain?: string;
    encode?(val: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
    signed?: boolean;
}
export interface UseContext<T> {
    initSession: (id: string, payload: T) => Promise<string>;
    destroySession: () => Promise<void>;
    getSession: () => Promise<T | null>;
    updateSession: (payload: Partial<T>) => Promise<void>;
    isUserAuthenticated: () => Promise<boolean>;
}
export interface Store {
    /** Return callback URL as string **/
    returnTo?: string;
}
export interface FrameworkContext {
    getCookie: (cookieName: string) => string;
    setCookie: (cookieName: string, cookieValue: string | null, opts?: CookieSerializeOptions) => void;
}
export interface StoreContextOptions<T extends Store> extends TimedKVPeerOptions<T> {
    /** Property name used in isUserAuthenticated() method to define if the user is authenticated or not **/
    authentificationField: keyof T;
    /** HTTP Cookies options. Will be used when creating the session cookie. **/
    setCookiesOptions?: CookieSerializeOptions;
}
/**
* @class StoreContext
* @description A session store designed to preserve a session between several Node.js instances
*
* @property {keyof T | null} authenticationField - if a specific field is specified for authentication, it will be provided here.
* @property {CookieSerializeOptions} cookiesOptions - the options for the cookies
*
* @example
* ```ts
* export interface DextStore extends Store {
*   mail?: string;
*   password?: string;
* }
*
* export const store = new StoreContext<DextStore>({
*   authentificationField: "mail"
* });
* ```
*/
export declare class StoreContext<T extends Store = Store> extends TimedKVPeer<T> {
    protected authenticationField: keyof T | null;
    protected cookiesOptions: CookieSerializeOptions;
    constructor(options?: Partial<StoreContextOptions<T>>);
    get redis(): import("ioredis/built/Redis").default;
    /**
    * @description this method allow you to initialize a session
    *
    * @param id - id of the session
    * @param ctx - http context object
    * @param payload - the "initial" payload of the session
    *
    * @example
    * ```ts
    * import { randomUUID } from "crypto";
    *
    * const sessionId = await handler.initSession(randomUUID(), ctx, { returnTo: "http://localhost:3000/" });
    * ```
    */
    initSession(id: string, ctx: FrameworkContext, payload: T): Promise<string>;
    destroySession(ctx: FrameworkContext): Promise<void>;
    getSession(ctx: FrameworkContext): Promise<T | null>;
    /**
    * @description Update partially or completely values attached to the session.
    *
    * @param ctx - http context object.
    * @param payload - the new property to assign at the session
    */
    updateSession(ctx: FrameworkContext, payload: Partial<T>): Promise<void>;
    /**
    * @description Verifies that the user of the current session is authenticated.
    * @param ctx http context object
    */
    isUserAuthenticated(ctx: FrameworkContext): Promise<boolean>;
    /**
     * @param {FrameworkContext} ctx http context object
     */
    useContext(ctx: FrameworkContext): UseContext<T>;
    /**
    * @param ctx http context object
    */
    private getSessionId;
}
//# sourceMappingURL=StoreContext.class.d.ts.map