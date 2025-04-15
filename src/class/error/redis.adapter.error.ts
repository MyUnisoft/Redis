export class SetValueError extends Error {
  constructor(key: string | Buffer, value: unknown) {
    super(`Redis Transaction failed for the given key: ${key} & value: ${value}`);
  }
}
