// Import Third-party Dependencies
import { Err, Ok, Result } from "@openally/result";

// Import Internal Dependencies
import { AssertConnectionError, AssertDisconnectionError } from "./Error/Connection.error.class";

// CONSTANTS
const kDefaultAttempt = 4;
const kDefaultTimeout = 500;

export interface DatabaseConnection {
  connect(): Promise<void>;
  close(forceExit?: boolean): Promise<void>;
  isAlive(): Promise<boolean>;
  getPerformance(): Promise<number>;

  setValue(...unknown): Promise<any>;
  deleteValue(...unknown): Promise<any>;
  getValue(...unknown): Promise<any>;
}

export type GetConnectionPerfResponse = {
  isAlive: boolean;
  perf: number;
};

export type ConnectionOptions = {
  attempt?: number;
  disconnectionTimeout?: number;
};

export class Connection<T extends DatabaseConnection = DatabaseConnection> {
  #attempt: number;

  instance: T;

  constructor(dbConnection: T, options: ConnectionOptions = {}) {
    this.instance = dbConnection;
    this.#attempt = options.attempt ?? kDefaultAttempt;
  }

  async initialize(): Promise<Result<void, AssertConnectionError>> {
    try {
      await this.instance.connect();

      return Ok(void 0);
    }
    catch {
      return this.assertConnection();
    }
  }

  async getConnectionPerf(): Promise<GetConnectionPerfResponse> {
    const start = performance.now();
    const isAlive = await this.instance.isAlive();

    return { isAlive, perf: performance.now() - start };
  }

  async close(forceExit: boolean = false): Promise<Result<void, AssertDisconnectionError>> {
    const { isAlive } = await this.getConnectionPerf();

    if (!isAlive) {
      return Ok(void 0);
    }

    await this.instance.close(forceExit);

    return Ok(void 0);
  }

  private async assertConnection(attempt = this.#attempt): Promise<Result<void, AssertConnectionError>> {
    if (attempt <= 0) {
      return Err(new AssertConnectionError());
    }

    const { isAlive } = await this.getConnectionPerf();

    if (!isAlive) {
      return this.assertConnection(attempt - 1);
    }

    return Ok(void 0);
  }
}
