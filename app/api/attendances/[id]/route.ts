export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { BUCKET_AVATARS, deleteFromMinio } from "@/lib/minio";
import { getJakartaDayKey } from "@/lib/helper/date";

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
  } catch {
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

    const updateData: Prisma.AttendanceUpdateInput = {};

    if (body.userId) updateData.userId = body.userId;
    if (body.date) {
      const date = new Date(body.date);
      updateData.date = date;
      const attendanceDay = getJakartaDayKey(date);
      updateData.attendanceDay = attendanceDay;
    }
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
    const message = error instanceof Error ? error.message : "";
    if (message.includes("P2002") || message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Attendance already exists for this user on that day" },
        { status: 409 },
      );
    }
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
      select: {
        id: true,
        checkInFaceImage: true,
        checkOutFaceImage: true,
      },
    });
    if (!existing) return NextResponse.json({ message: "Attendance not found" }, { status: 404 });

    const evidenceUrls = [existing.checkInFaceImage, existing.checkOutFaceImage].filter(
      (url): url is string => typeof url === "string" && url.includes(BUCKET_AVATARS),
    );

    await Promise.all(evidenceUrls.map((url) => deleteFromMinio(url)));

    await prisma.attendance.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Attendance successfully deleted",
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete attendance" },
      { status: 500 },
    );
  }
}
