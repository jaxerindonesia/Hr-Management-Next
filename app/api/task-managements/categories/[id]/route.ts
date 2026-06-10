export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Category id is required" }, { status: 400 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const category = await prisma.taskCategory.findFirst({
      where: {
        id,
        ...(scopedTenantId ? { department: { tenantId: scopedTenantId } } : {}),
      },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.taskCategoryOnTask.deleteMany({ where: { categoryId: id } }),
      prisma.taskCategory.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Task category deleted successfully" });
  } catch (error) {
    console.error("DELETE TASK CATEGORY ERROR:", error);
    return NextResponse.json({ message: "Failed to delete task category" }, { status: 500 });
  }
}
