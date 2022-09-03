// Import Internal Dependencies
import { parseData } from "..";

export type XINFOConsumers = (string | number)[][];

export interface XINFOConsumerData {
  name: string;
  pending: number;
  idle: number;
}

export function parseXINFOConsumers(consumers: XINFOConsumers): XINFOConsumerData[] {
  const formatedConsumers: XINFOConsumerData[] = [];

  for (const consumer of consumers) {
    const formatedConsumer = {};

    for (const [key, value] of parseData(consumer)) {
      formatedConsumer[key as string] = value;
    }

    formatedConsumers.push(formatedConsumer as XINFOConsumerData);
  }

  return formatedConsumers;
}
