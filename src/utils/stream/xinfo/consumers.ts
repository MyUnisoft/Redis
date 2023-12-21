// Import Internal Dependencies
import { parseData } from "..";

export type XINFOConsumers = (string | number)[][];

export interface XINFOConsumerData {
  name: string;
  pending: number;
  idle: number;
}

export function parseXINFOConsumers(consumers: XINFOConsumers): XINFOConsumerData[] {
  const formattedConsumers: XINFOConsumerData[] = [];

  for (const consumer of consumers) {
    const formattedConsumer = {};

    for (const [key, value] of parseData(consumer)) {
      formattedConsumer[key as string] = value;
    }

    formattedConsumers.push(formattedConsumer as XINFOConsumerData);
  }

  return formattedConsumers;
}
