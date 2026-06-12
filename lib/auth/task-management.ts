import { isSuperAdmin, type SessionUser } from "@/lib/auth/session";

function isAdmin(roleName: string) {
  return roleName.toLowerCase().replace(/\s/g, "") === "admin";
}

export function canManageTaskDepartment(user: SessionUser, departmentId: string) {
  if (isSuperAdmin(user.roleName) || isAdmin(user.roleName)) {
    return true;
  }

  return Boolean(user.departmentId && user.departmentId === departmentId);
}
