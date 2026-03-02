export const MASTER_PERMISSIONS = [
  {
    model: "dashboard",
    actions: ["get-all"],
  },
  {
    model: "attendance",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "leaves",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "payroll",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "users",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
];
