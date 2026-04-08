import { NextResponse } from "next/server";
import { getSessionUser, isSuperAdmin, type SessionUser } from "@/lib/auth/session";

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      user: null,
    } as const;
  }

  return { error: null, user } as const;
}

export function requireSuperAdmin(user: SessionUser) {
  if (!isSuperAdmin(user.roleName)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return null;
}

export function ensureTenantScope(user: SessionUser) {
  if (isSuperAdmin(user.roleName)) return null;
  return user.tenantId;
}

export function tenantWhere(user: SessionUser) {
  const tenantId = ensureTenantScope(user);
  if (!tenantId) return {};

  return { tenantId };
}
