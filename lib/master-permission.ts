export const MASTER_PERMISSIONS = [
  {
    model: "users",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "roles",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "submissions",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "submission_types",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "attendances",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "payrolls",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "performances",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "reimbursements",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
];
