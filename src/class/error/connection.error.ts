export class AssertConnectionError extends Error {
  constructor() {
    super("Failed at initializing the Redis connection");
  }
}

export class AssertDisconnectionError extends Error {
  constructor() {
    super("Failed at closing the Redis connection");
  }
}
