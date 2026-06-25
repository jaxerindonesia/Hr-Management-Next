export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { canManageTaskDepartment } from "@/lib/auth/task-management";

async function ensureDepartment(departmentId: string, tenantId: string | null) {
  return prisma.department.findFirst({
    where: {
      id: departmentId,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const departmentId = req.nextUrl.searchParams.get("departmentId") || "";
    if (!departmentId) {
      return NextResponse.json({ message: "Department is required" }, { status: 400 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const department = await ensureDepartment(departmentId, scopedTenantId);
    if (!department) {
      return NextResponse.json({ message: "Department not found" }, { status: 404 });
    }

    const permissions = await prisma.taskDoneMovePermission.findMany({
      where: { departmentId },
      select: { userId: true },
      orderBy: { createdAt: "asc" },
    });
    const users = permissions.length
      ? await prisma.user.findMany({
          where: {
            id: { in: permissions.map((item) => item.userId) },
            departmentId,
            deletedAt: null,
            ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
          },
          select: { id: true, name: true, email: true, position: true, avatarUrl: true },
          orderBy: { name: "asc" },
        })
      : [];

    return NextResponse.json({
      message: "Task done move permissions retrieved successfully",
      data: {
        userIds: permissions.map((item) => item.userId),
        users,
      },
    });
  } catch (error) {
    console.error("GET TASK DONE PERMISSIONS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to retrieve task done permissions" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const departmentId = String(body.departmentId || "");
    const userIds = Array.isArray(body.userIds) ? body.userIds.map(String) : [];

    if (!departmentId) {
      return NextResponse.json({ message: "Department is required" }, { status: 400 });
    }
    if (!canManageTaskDepartment(auth.user, departmentId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const department = await ensureDepartment(departmentId, scopedTenantId);
    if (!department) {
      return NextResponse.json({ message: "Department not found" }, { status: 404 });
    }

    const uniqueIds = Array.from(
      new Set(userIds.filter((id: string | null | undefined): id is string => Boolean(id))),
    ) as string[];
    const validUsers = uniqueIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: uniqueIds },
            departmentId,
            deletedAt: null,
            ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
          },
          select: { id: true },
        })
      : [];

    if (validUsers.length !== uniqueIds.length) {
      return NextResponse.json(
        { message: "Selected users must belong to this department" },
        { status: 400 },
      );
    }

    await prisma.taskDoneMovePermission.deleteMany({ where: { departmentId } });
    if (uniqueIds.length > 0) {
      await prisma.taskDoneMovePermission.createMany({
        data: uniqueIds.map((userId) => ({ departmentId, userId })),
      });
    }

    return NextResponse.json({
      message: "Task done move permissions updated successfully",
      data: { userIds: uniqueIds },
    });
  } catch (error) {
    console.error("UPDATE TASK DONE PERMISSIONS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update task done permissions" },
      { status: 500 },
    );
  }
}
