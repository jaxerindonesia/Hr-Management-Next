export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "departments", "get-all");
    if (forbid) return forbid;
    const scopedTenantId = ensureTenantScope(auth.user);

    const departments = await prisma.department.findMany({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        tenant: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Departments retrieved successfully",
      data: departments,
    });
  } catch (error) {
    console.error("GET DEPARTMENTS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve departments data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "departments", "create");
    if (forbid) return forbid;

    const body = await req.json();

    const rawName = String(body.name || "").trim();

    if (!rawName) {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;
    const existingDepartment = await prisma.department.findFirst({
      where: {
        ...(finalTenantId ? { tenantId: finalTenantId } : { tenantId: null }),
        name: { equals: rawName, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { message: "Nama departemen sudah digunakan pada tenant ini" },
        { status: 409 },
      );
    }

    const department = await prisma.department.create({
      data: { name: rawName, tenantId: finalTenantId },
    });

    return NextResponse.json(
      {
        message: "Department successfully created.",
        data: department,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE DEPARTMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create department" },
      { status: 500 },
    );
  }
}
