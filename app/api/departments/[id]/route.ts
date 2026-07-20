export const runtime = "nodejs";

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { writeAuditLog } from "@/lib/security/audit-log";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "departments", "get-by-id");
    if (forbid) return forbid;
    const scopedTenantId = ensureTenantScope(auth.user);

    const department = await prisma.department.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
    });

    if (!department) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve department" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "departments", "update");
    if (forbid) return forbid;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.department.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Department not found" }, { status: 404 });

    const body = await req.json();
    const rawName = String(body.name || "").trim();

    const updateData: any = {};

    if (rawName) {
      const duplicateDepartment = await prisma.department.findFirst({
        where: {
          ...(scopedTenantId ? { tenantId: scopedTenantId } : { tenantId: null }),
          name: { equals: rawName, mode: "insensitive" },
          NOT: { id: p.id },
        },
        select: { id: true },
      });

      if (duplicateDepartment) {
        return NextResponse.json(
          { message: "Nama departemen sudah digunakan pada tenant ini" },
          { status: 409 },
        );
      }

      updateData.name = rawName;
    }

    const department = await prisma.department.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Department successfully updated",
      data: department,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update department" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "departments", "delete");
    if (forbid) return forbid;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.department.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Department not found" }, { status: 404 });

    await prisma.department.delete({
      where: { id: p.id },
    });

    writeAuditLog({
      action: "departments.delete",
      status: "success",
      actorUserId: auth.user.id,
      actorRole: auth.user.roleName,
      tenantId: auth.user.tenantId,
      targetType: "department",
      targetId: p.id,
      message: "Department deleted",
    });

    return NextResponse.json({
      message: "Department successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete department" },
      { status: 500 },
    );
  }
}
