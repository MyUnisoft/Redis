// Import Third-party Dependencies
import { Result } from "@openally/result";

export type KeyType = string | Buffer;

export type Value = string | Buffer | number;

export type Data = Record<string, Value>;

export interface Entry {
  id: string;
  data: Data;
}

export interface Pending {
  id: string;
  consumerName?: string;
  idleTime: number;
  unknown: number;
}

export interface Consumer {
  name: string;
  seenTime: number;
  pelCount: number;
  pending: Pending[];
}

export interface Group {
  name: string;
  lastDeliveredId: string;
  pelCount: number;
  pending: Pending[];
  consumers: Consumer[];
}

export type GetConnectionPerfResponse = {
  isAlive: boolean;
  perf?: number;
};

export type DatabaseConnection<T extends unknown = unknown> = BasicDatabaseConnection & T;

export interface BasicDatabaseConnection {
  initialize?(...unknown): Promise<unknown>;
  close?(forceExit?: boolean): Promise<void>;
  isAlive?(): Promise<boolean>;
  getPerformance?(): Promise<GetConnectionPerfResponse>;

  setValue(...unknown): Promise<Result<KeyType, Error>> | Result<KeyType, Error>;
  deleteValue(...unknown): Promise<number> | number;
  getValue(...unknown): Promise<unknown> | unknown;
}
