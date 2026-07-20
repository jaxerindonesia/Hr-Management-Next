import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getExpiredAuthCookieOptions } from "@/lib/auth/cookie";
import { getSessionUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function POST() {
  const token = (await cookies()).get("token")?.value;
  const user = await getSessionUser();

  if (token) {
    await prisma.user.updateMany({
      where: { currentToken: token },
      data: { currentToken: "" },
    });
  }

  const response = NextResponse.json({
    message: "Logout successful",
  });

  // hapus cookie token
  response.cookies.set("token", "", getExpiredAuthCookieOptions());

  response.cookies.set("remember_me", "", getExpiredAuthCookieOptions());

  writeAuditLog({
    action: "auth.logout",
    status: "success",
    actorUserId: user?.id ?? null,
    actorRole: user?.roleName ?? null,
    tenantId: user?.tenantId ?? null,
    message: "Logout successful",
  });

  return response;
}
