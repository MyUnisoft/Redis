// Import Third-party Dependencies
import { Result, Err, Ok } from "@openally/result";
import EphemeralMap, { tSv } from "@openally/ephemeral-map";

// Import Internal Dependencies
import type {
  DatabaseConnection,
  KeyType
} from "../../types";
import { SetValueError } from "../error/memory.adapter.error";

export interface InMemSetValueOptions {
  key: string;
  value: unknown;
  expiresIn?: number;
}

export interface InMemIsKeyExpiredOptions {
  value: Record<string, unknown>;
  banTimeInSecond: number;
}

export class MemoryAdapter implements DatabaseConnection {
  #values: EphemeralMap<string, unknown> = new EphemeralMap();

  flushall() {
    this.#values = new EphemeralMap();
  }

  setValue(options: InMemSetValueOptions): Result<KeyType, SetValueError> {
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

  clearExpired(options: { banTimeInSecond: number; }): (string | Buffer)[] {
    const { banTimeInSecond } = options;

    const expired: string[] = [];

    for (const [key, value] of this.#values) {
      if (this.isKeyExpired({
        banTimeInSecond,
        value: value as Record<string, unknown>
      })) {
        expired.push(key);
        this.#values.delete(key);
      }
    }

    return expired;
  }

  // Implement the no-argument version of getValue
  getValue(key: string): null | unknown {
    const valueExist = this.#values.has(key);

    if (!valueExist) {
      return null;
    }

    return this.#values.get(key);
  }

  private isKeyExpired(options: InMemIsKeyExpiredOptions) {
    const { banTimeInSecond, value } = options;

    const lastTry = "lastTry" in value ? Number(value.lastTry) : null;

    return lastTry === null ? false : (Date.now() - lastTry) / 1000 >= banTimeInSecond;
  }
}
