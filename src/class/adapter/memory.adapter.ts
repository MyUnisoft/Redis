// Import Third-party Dependencies
import { Result, Err, Ok } from "@openally/result";
import EphemeralMap, { tSv } from "@openally/ephemeral-map";

// Import Internal Dependencies
import type {
  DatabaseConnection,
  KeyType
} from "../../types";
import { SetValueError } from "../error/memory.adapter.error";

export type InMemSetValueOptions<T = unknown> = {
  key: string;
  value: T;
  expiresIn?: number;
};

export interface InMemIsKeyExpiredOptions {
  value: Record<string, unknown>;
  banTimeInSecond: number;
}

export class MemoryAdapter <T = unknown> implements DatabaseConnection {
  #values: EphemeralMap<string, T> = new EphemeralMap();

  flushall() {
    this.#values = new EphemeralMap();
  }

  async setValue(options: InMemSetValueOptions<T>): Promise<Result<KeyType, SetValueError>> {
    const { key, value, expiresIn } = options;

    const valueExist = this.#values.has(key);

    if (valueExist) {
      return Err(new SetValueError(key));
    }

    this.#values.set(tSv({ ttl: expiresIn })(key), value);

    return Ok(key);
  }

  deleteValue(key: string): Promise<number> {
    return Promise.resolve(this.#values.delete(key) ? 1 : 0);
  }

  getValue(key: string): Promise<T | null> {
    return Promise.resolve(this.#values.get(key) ?? null);
  }
}
