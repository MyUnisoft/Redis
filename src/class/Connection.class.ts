// Import Node.js Dependencies
import { once } from "node:events";
import { performance } from "node:perf_hooks";

// Import Third-Party Dependencies
import {
  Redis,
  type RedisOptions
} from "ioredis";
import {
  Err,
  Ok,
  type Result
} from "@openally/result";

// CONSTANTS
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;

type AssertDisconnectionErrorMessage = "Failed at closing the Redis connection";

export type GetConnectionPerfResponse = {
  isAlive: boolean;
  perf: number;
};

export type AssertConnectionResponse = Result<void, "Failed at initializing the Redis connection">;
export type AssertDisconnectionResponse = Result<void, AssertDisconnectionErrorMessage>;
export type CloseResponse = Result<void, AssertDisconnectionErrorMessage | "Redis connection already closed">;

export type ConnectionOptions = Partial<RedisOptions> & {
  port?: number;
  host?: string;
  attempt?: number;
  disconnectionTimeout?: number;
};

export class Connection extends Redis {
  #attempt: number;
  #disconnectionTimeout: number;

  isAlive: boolean = false;

  constructor(options: ConnectionOptions = {}) {
    const { port, host, password } = options;

    if (typeof port !== "undefined" && typeof host !== "undefined") {
      super(port, host, { password });
    }
    else {
      super({ password });
    }

    this.#attempt = options.attempt ?? kDefaultAttempt;
    this.#disconnectionTimeout = options.disconnectionTimeout ?? kDefaultTimeout;
  }

  async initialize(): Promise<AssertConnectionResponse> {
    return this.assertConnection();
  }

  async getConnectionPerf(): Promise<GetConnectionPerfResponse> {
    const start = performance.now();

    try {
      await this.ping();
    }
    catch {
      this.isAlive = false;

      return { isAlive: false, perf: performance.now() - start };
    }

    return { isAlive: true, perf: performance.now() - start };
  }

  async close(forceExit: boolean = false): Promise<CloseResponse> {
    const { isAlive } = await this.getConnectionPerf();

    if (!isAlive) {
      return Ok(void 0);
    }

    await this.assertDisconnection(forceExit);

    return Ok(void 0);
  }

  private async assertConnection(attempt = this.#attempt): Promise<AssertConnectionResponse> {
    if (attempt <= 0) {
      return Err("Failed at initializing the Redis connection");
    }

    const { isAlive } = await this.getConnectionPerf();

    if (!isAlive) {
      await this.assertConnection(attempt - 1);
    }

    this.isAlive = true;

    return Ok(void 0);
  }

  private async assertDisconnection(forceExit: boolean, attempt = this.#attempt): Promise<AssertDisconnectionResponse> {
    if (attempt <= 0) {
      return Err("Failed at closing the Redis connection");
    }

    if (forceExit) {
      this.disconnect();
    }
    else {
      this.quit();
    }

    try {
      await once(this, "end", {
        signal: AbortSignal.timeout(this.#disconnectionTimeout)
      });
    }
    catch {
      await this.assertDisconnection(forceExit, attempt - 1);
    }

    this.isAlive = false;

    return Ok(void 0);
  }
}
