export const groups = [
  ["name", "myGroupName", "consumers", 2, "pending", 2, "last-delivered-id", "1599999-0"],
  ["name", "mySecondGroupName", "consumers", 4, "pending", 10, "last-delivered-id", "2590589-9"]
];

export const formattedGroups = [
  {
    name: "myGroupName",
    consumers: 2,
    pending: 2,
    lastDeliveredId: "1599999-0"
  },
  {
    name: "mySecondGroupName",
    consumers: 4,
    pending: 10,
    lastDeliveredId: "2590589-9"
  }
];
