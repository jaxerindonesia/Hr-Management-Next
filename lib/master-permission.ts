export const MASTER_PERMISSIONS = [
  {
    model: "users",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "roles",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "departments",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "submissions",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "submission_types",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
  {
    model: "attendances",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "payrolls",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "performances",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "reimbursements",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
];
