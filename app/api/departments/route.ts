export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
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

    const body = await req.json();

    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const department = await prisma.department.create({
      data: { name, tenantId: finalTenantId },
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
