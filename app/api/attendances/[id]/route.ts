export const runtime = "nodejs";

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

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
    const scopedTenantId = ensureTenantScope(auth.user);

    const attendance = await prisma.attendance.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Attendance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve attendance" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.attendance.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Attendance not found" }, { status: 404 });

    const body = await req.json();

    const updateData: any = {};

    if (body.userId) updateData.userId = body.userId;
    if (body.date) updateData.date = new Date(body.date);
    if (body.checkIn) updateData.checkIn = body.checkIn;
    if (body.checkOut) updateData.checkOut = body.checkOut;
    if (body.status) updateData.status = body.status;
    if (body.notes) updateData.notes = body.notes;

    const attendance = await prisma.attendance.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Attendance successfully updated",
      data: attendance,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update attendance" },
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

    const existing = await prisma.attendance.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Attendance not found" }, { status: 404 });

    await prisma.attendance.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Attendance successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete attendance" },
      { status: 500 },
    );
  }
}
