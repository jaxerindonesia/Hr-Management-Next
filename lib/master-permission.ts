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
    model: "task-managements",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
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
  {
    model: "overtimes",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "pettycash",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "finance",
    actions: ["get-all", "get-by-id", "create", "update", "delete", "export"],
  },
  {
    model: "tenants",
    actions: ["get-all", "get-by-id", "create", "update", "delete"],
  },
];
