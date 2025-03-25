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

export class MemoryAdapter<T = unknown> implements DatabaseConnection {
  #values: EphemeralMap<string, T> = new EphemeralMap();

  flushall() {
    this.#values = new EphemeralMap();
  }

  setValue<U extends T = T>(options: InMemSetValueOptions<U>): Result<KeyType, SetValueError> {
    const { key, value, expiresIn } = options;

    const valueExist = this.#values.has(key);

    if (valueExist) {
      return Err(new SetValueError(key));
    }

    this.#values.set(tSv({ ttl: expiresIn })(key), value);

    return Ok(key);
  }

  deleteValue(key: string) {
    const isDelete = this.#values.delete(key);

    return isDelete ? 1 : 0;
  }

  getValue<U = T>(key: string): U | null {
    const valueExist = this.#values.has(key);

    if (!valueExist) {
      return null;
    }

    return this.#values.get(key) as U;
  }
}
