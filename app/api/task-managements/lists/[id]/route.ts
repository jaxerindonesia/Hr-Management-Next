export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = {
  params: {
    id: string;
  };
};

async function findScopedList(id: string, tenantId: string | null) {
  return prisma.taskList.findFirst({
    where: {
      id,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;

  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const scopedTenantId = ensureTenantScope(auth.user);
    const existing = await findScopedList(p.id, scopedTenantId);
    if (!existing) {
      return NextResponse.json({ message: "Task list not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: { name?: string; position?: number } = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.position !== undefined) updateData.position = Number(body.position);

    if (updateData.name !== undefined && !updateData.name) {
      return NextResponse.json(
        { message: "List name is required" },
        { status: 400 },
      );
    }

    const list = await prisma.taskList.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Task list successfully updated",
      data: list,
    });
  } catch (error) {
    console.error("UPDATE TASK LIST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update task list" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;

  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const scopedTenantId = ensureTenantScope(auth.user);
    const existing = await findScopedList(p.id, scopedTenantId);
    if (!existing) {
      return NextResponse.json({ message: "Task list not found" }, { status: 404 });
    }

    await prisma.taskList.delete({ where: { id: p.id } });

    return NextResponse.json({
      message: "Task list successfully deleted",
    });
  } catch (error) {
    console.error("DELETE TASK LIST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete task list" },
      { status: 500 },
    );
  }
}
