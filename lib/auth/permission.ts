import { NextResponse } from "next/server";
import { isSuperAdmin, type SessionUser } from "@/lib/auth/session";

export function hasPermission(
  user: SessionUser,
  model: string,
  action: string,
) {
  if (isSuperAdmin(user.roleName)) return true;

  return user.permissions.some(
    (permission) =>
      permission.model === model && permission.action === action,
  );
}

export function requirePermission(
  user: SessionUser,
  model: string,
  action: string,
) {
  if (hasPermission(user, model, action)) {
    return null;
  }

  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}
