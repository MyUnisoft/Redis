// Import Third-party Dependencies
import { Result, Ok, Err } from "@openally/result";

// Import Internal Dependencies
import { TimedKVPeer, type TimedKVPeerOptions } from "./TimedKVPeer.class.js";

// CONSTANTS
const kDefaultCookiesOptions: CookieSerializeOptions = { sameSite: "none", secure: true };
const kStoreContextSessionName = "session-id";

export interface CookieSerializeOptions {
  domain?: string;
  encode? (val: string): string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  signed?: boolean;
}

export interface UseContext<T> {
  initSession: (id: string, payload: T) => Promise<InitSessionResponse>;
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

export type InitSessionErr = "id must not be an empty string";
export type GetSessionIdErr = "Unable to found any cookie session-id. Your session is probably expired!";

type InitSessionResponse = Result<string, InitSessionErr>;

export interface StoreContextOptions<T extends Store> extends TimedKVPeerOptions<T> {
  /** Property name used in isUserAuthenticated() method to define if the user is authenticated or not **/
  authenticationField?: keyof T;
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
*   authenticationField: "mail"
* });
* ```
*/
export class StoreContext<T extends Store = Store> extends TimedKVPeer<T> {
  protected authenticationField: keyof T | null;
  protected cookiesOptions: CookieSerializeOptions;

  constructor(options: StoreContextOptions<T>) {
    super(options);

    this.authenticationField = options.authenticationField ?? null;
    this.cookiesOptions = typeof options.setCookiesOptions === "undefined" ? Object.assign({}, kDefaultCookiesOptions) :
      Object.assign({}, kDefaultCookiesOptions, options.setCookiesOptions);
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
  async initSession(id: string, ctx: FrameworkContext, payload: T): Promise<InitSessionResponse> {
    if (!id) {
      return Err("id must not be an empty string");
    }

    ctx.setCookie(kStoreContextSessionName, id, this.cookiesOptions);

    if (!("returnTo" in payload)) {
      payload.returnTo = "false";
    }

    await this.setValue({
      key: id,
      value: payload,
      prefix: this.prefix,
      type: this.type
    });

    return Ok(id);
  }

  async destroySession(ctx: FrameworkContext): Promise<void> {
    const sessionId = this.getSessionId(ctx).unwrap();

    ctx.setCookie(kStoreContextSessionName, null);

    await this.adapter.deleteValue(sessionId);
  }

  getSession(ctx: FrameworkContext): Promise<T | null> {
    const getSessionResult = this.getSessionId(ctx);

    if (!getSessionResult.ok) {
      throw new Error(getSessionResult.val);
    }

    const val = getSessionResult.unwrap();

    return this.getValue(val);
  }

  /**
  * @description Update partially or completely values attached to the session.
  *
  * @param ctx - http context object.
  * @param payload - the new property to assign at the session
  */
  async updateSession(ctx: FrameworkContext, payload: Partial<T>) {
    const getSessionResult = this.getSessionId(ctx);

    if (!getSessionResult.ok) {
      throw new Error(getSessionResult.val);
    }

    const val = getSessionResult.unwrap();

    await this.setValue({
      key: val,
      value: payload,
      prefix: this.prefix,
      type: this.type
    });
  }

  /**
  * @description Verifies that the user of the current session is authenticated.
  * @param ctx http context object
  */
  async isUserAuthenticated(ctx: FrameworkContext): Promise<boolean> {
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
  useContext(ctx: FrameworkContext): UseContext<T> {
    return {
      initSession: (id: string, payload: T) => this.initSession(id, ctx, payload),
      destroySession: () => this.destroySession(ctx),
      getSession: () => this.getSession(ctx),
      updateSession: (payload: Partial<T>) => this.updateSession(ctx, payload),
      isUserAuthenticated: () => this.isUserAuthenticated(ctx)
    };
  }

  /**
  * @param ctx http context object
  */
  private getSessionId(ctx: FrameworkContext): Result<string, GetSessionIdErr> {
    const sessionId = ctx.getCookie(kStoreContextSessionName);
    if (!sessionId) {
      return Err("Unable to found any cookie session-id. Your session is probably expired!");
    }

    return Ok(sessionId);
  }
}
