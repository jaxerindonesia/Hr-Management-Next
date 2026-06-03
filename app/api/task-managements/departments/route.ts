export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const scopedTenantId = ensureTenantScope(auth.user);

    const departments = await prisma.department.findMany({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tenantId: true,
        users: {
          where: { deletedAt: null, status: "active" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
        tasks: {
          select: {
            id: true,
            dueDate: true,
            list: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            users: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Task departments retrieved successfully",
      data: departments,
    });
  } catch (error) {
    console.error("GET TASK DEPARTMENTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to retrieve task departments" },
      { status: 500 },
    );
  }
}
