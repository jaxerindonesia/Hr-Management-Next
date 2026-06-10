export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const departmentId = req.nextUrl.searchParams.get("departmentId") || "";
    if (!departmentId) {
      return NextResponse.json({ message: "Department is required" }, { status: 400 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
      },
      select: { id: true },
    });
    if (!department) {
      return NextResponse.json({ message: "Department not found" }, { status: 404 });
    }

    const categories = await prisma.taskCategory.findMany({
      where: { departmentId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ message: "Task categories retrieved successfully", data: categories });
  } catch (error) {
    console.error("GET TASK CATEGORIES ERROR:", error);
    return NextResponse.json({ message: "Failed to retrieve task categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const departmentId = String(body.departmentId || "");
    const name = String(body.name || "").trim();

    if (!departmentId || !name) {
      return NextResponse.json({ message: "Department and category name are required" }, { status: 400 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
      },
      select: { id: true },
    });
    if (!department) {
      return NextResponse.json({ message: "Department not found" }, { status: 404 });
    }

    const category = await prisma.taskCategory.create({
      data: {
        departmentId,
        name,
      },
    });

    return NextResponse.json({ message: "Task category created successfully", data: category }, { status: 201 });
  } catch (error) {
    console.error("CREATE TASK CATEGORY ERROR:", error);
    return NextResponse.json({ message: "Failed to create task category" }, { status: 500 });
  }
}
