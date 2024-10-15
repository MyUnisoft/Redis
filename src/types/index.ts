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
  perf: number;
};

export interface DatabaseConnection {
  close(forceExit?: boolean): Promise<void>;
  isAlive(): Promise<boolean>;
  getPerformance(): Promise<GetConnectionPerfResponse>;

  initialize(...unknown): Promise<unknown>;
  setValue(...unknown): Promise<KeyType>;
  deleteValue(...unknown): Promise<number>;
  clearExpired(...unknown): Promise<string[]>;
  getValue(...unknown): Promise<unknown>;
}
