// Import Internal Dependencies
import { Data } from "./index";

export interface Entry {
  id: string;
  data: Data;
}

export interface Pending {
  id: string;
  consumerName?: string;
  idleTime: number,
  unknow: number;
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
