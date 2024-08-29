// Import Node.js Dependencies
import { randomBytes } from "crypto";

// return a random value with RandomBytes from crypto module
export function randomValue(): string {
  return randomBytes(6).toString("hex");
}
