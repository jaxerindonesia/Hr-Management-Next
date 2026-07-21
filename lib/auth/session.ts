import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

type JwtPayload = {
  sub?: string;
  role?: string;
};

export type SessionUser = {
  id: string;
  roleName: string;
  tenantId: string | null;
  departmentId: string | null;
  permissions: Array<{
    model: string;
    action: string;
  }>;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (!decoded?.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        role: { select: { name: true, permission: true } },
        tenant: {
          select: {
            isActive: true,
            subscriptionEnd: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) return null;
    if (!user.currentToken || user.currentToken !== token) return null;

    if (user.tenantId && user.tenant) {
      if (!user.tenant.isActive) return null;

      if (user.tenant.subscriptionEnd) {
        const endDate = new Date(user.tenant.subscriptionEnd);
        endDate.setHours(23, 59, 59, 999);
        if (Date.now() > endDate.getTime()) return null;
      }
    }

    return {
      id: user.id,
      roleName: user.role.name,
      tenantId: user.tenantId ?? null,
      departmentId: user.departmentId ?? null,
      permissions: Array.isArray(user.role.permission)
        ? (user.role.permission as Array<{ model: string; action: string }>)
        : [],
    };
  } catch {
    return null;
  }
}

export function isSuperAdmin(roleName: string) {
  return roleName.toLowerCase().replace(/\s/g, "") === "superadmin";
}
