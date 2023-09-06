"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreContext = void 0;
// Import Internal Dependencies
const TimedKVPeer_class_1 = require("./TimedKVPeer.class");
const index_1 = require("../index");
// CONSTANTS
const kDefaultCookiesOptions = { sameSite: "none", secure: true };
const kStoreContextSessionName = "session-id";
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
class StoreContext extends TimedKVPeer_class_1.TimedKVPeer {
    constructor(options) {
        super(options);
        this.authenticationField = options?.authentificationField ?? null;
        this.cookiesOptions = typeof options?.setCookiesOptions === "undefined" ? Object.assign({}, kDefaultCookiesOptions) :
            Object.assign({}, kDefaultCookiesOptions, options.setCookiesOptions);
    }
    get redis() {
        const redis = (0, index_1.getRedis)();
        if (!redis) {
            throw new Error("Redis must be init");
        }
        return redis;
    }
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
    async initSession(id, ctx, payload) {
        if (!id) {
            throw new Error("id must not be an empty string");
        }
        ctx.setCookie(kStoreContextSessionName, id, this.cookiesOptions);
        if (!("returnTo" in payload)) {
            payload.returnTo = "false";
        }
        await this.setValue({ key: id, value: payload });
        return id;
    }
    async destroySession(ctx) {
        const sessionId = this.getSessionId(ctx);
        ctx.setCookie(kStoreContextSessionName, null);
        await this.deleteValue(sessionId);
    }
    getSession(ctx) {
        const sessionId = this.getSessionId(ctx);
        return this.getValue(sessionId);
    }
    /**
    * @description Update partially or completely values attached to the session.
    *
    * @param ctx - http context object.
    * @param payload - the new property to assign at the session
    */
    async updateSession(ctx, payload) {
        const sessionId = this.getSessionId(ctx);
        await this.setValue({ key: sessionId, value: payload });
    }
    /**
    * @description Verifies that the user of the current session is authenticated.
    * @param ctx http context object
    */
    async isUserAuthenticated(ctx) {
        const sessionId = ctx.getCookie(kStoreContextSessionName);
        if (!sessionId) {
            return false;
        }
        const storeData = await this.getValue(sessionId);
        if (!storeData) {
            return false;
        }
        return this.authenticationField === null || this.authenticationField in storeData;
    }
    /**
     * @param {FrameworkContext} ctx http context object
     */
    useContext(ctx) {
        return {
            initSession: (id, payload) => this.initSession(id, ctx, payload),
            destroySession: () => this.destroySession(ctx),
            getSession: () => this.getSession(ctx),
            updateSession: (payload) => this.updateSession(ctx, payload),
            isUserAuthenticated: () => this.isUserAuthenticated(ctx)
        };
    }
    /**
    * @param ctx http context object
    */
    getSessionId(ctx) {
        const sessionId = ctx.getCookie(kStoreContextSessionName);
        if (!sessionId) {
            throw new TypeError("Unable to found any cookie session-id. Your session is probably expired!");
        }
        return sessionId;
    }
}
exports.StoreContext = StoreContext;
//# sourceMappingURL=StoreContext.class.js.map