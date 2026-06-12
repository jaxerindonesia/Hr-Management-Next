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
        role: { select: { name: true } },
      },
    });

    if (!user || user.deletedAt) return null;

    return {
      id: user.id,
      roleName: user.role.name,
      tenantId: user.tenantId ?? null,
      departmentId: user.departmentId ?? null,
    };
  } catch {
    return null;
  }
}

export function isSuperAdmin(roleName: string) {
  return roleName.toLowerCase().replace(/\s/g, "") === "superadmin";
}
