import { XGroups, XRedisData } from "../../../src/utils/stream";

export const pendings = [
  ["id", "consumerName", 20000, 1],
  ["id", "consumerName", 20000, 1],
  ["id", 20000, 1]
];

export const formattedPendings = [
  { id: "id", consumerName: "consumerName", idleTime: 20000, unknow: 1 },
  { id: "id", consumerName: "consumerName", idleTime: 20000, unknow: 1 },
  { id: "id", idleTime: 20000, unknow: 1 }
];

export const entries = [
  ["id", ["key", "value", "secondKey", 1]],
  ["secondId", ["key", "value", "secondKey", Buffer.from("abc")]]
];

export const formattedEntries = [
  { id: "id", data: { key: "value", secondKey: 1 } },
  { id: "secondId", data: { key: "value", secondKey: Buffer.from("abc") } }
];

export const consumers = [
  [
    ["name", "name", "seen-time", 2000, "pel-count", 28, "pending", pendings]
  ],
  [
    ["name", "name", "seen-time", 2000, "pel-count", 28, "pending", pendings],
    ["name", "name", "seen-time", 2000, "pel-count", 28, "pending", pendings]
  ]
];

export const formattedConsumers = [
  [
    { name: "name", seenTime: 2000, pelCount: 28, pending: formattedPendings }
  ],
  [
    { name: "name", seenTime: 2000, pelCount: 28, pending: formattedPendings },
    { name: "name", seenTime: 2000, pelCount: 28, pending: formattedPendings }
  ]
];

export const groups: XGroups = [
  [
    "name", "pulsarService", "last-delivered-id", "id", "pel-count", 20,
    "pending", pendings,
    "consumers", consumers[0]
  ],
  [
    "name", "pulsarService", "last-delivered-id", "id", "pel-count", 20,
    "pending", pendings,
    "consumers", consumers[1]
  ]
];

export const formattedGroups = [
  { name: "pulsarService", lastDeliveredId: "id", pelCount: 20, pending: formattedPendings, consumers: formattedConsumers[0] },
  { name: "pulsarService", lastDeliveredId: "id", pelCount: 20, pending: formattedPendings, consumers: formattedConsumers[1] }
];

export const streamData: XRedisData = [
  "length", 2,
  "radix-tree-keys", 1,
  "radix-tree-nodes", 2,
  "last-generated-id", "1588152473531-0",
  "entries", entries,
  "groups", groups
];

export const formattedStreamData = {
  length: 2,
  radixTreeKeys: 1,
  radixTreeNodes: 2,
  lastGeneratedId: "1588152473531-0",
  entries: formattedEntries,
  groups: formattedGroups
};
