export class SetValueError extends Error {
  constructor(key: string) {
    super(`Key already exist for ${key}`);
  }
}
