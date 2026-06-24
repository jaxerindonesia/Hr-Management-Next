export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { BUCKET_AVATARS, uploadBase64ToMinio } from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { getDateAtTime, getJakartaDayKey } from "@/lib/helper/date";

const DEFAULT_CONFIG = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
  workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;
    const { userId, checkOutLocation, faceCaptureBase64 } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "UserId is required" },
        { status: 400 },
      );
    }
    if (!faceCaptureBase64) {
      return NextResponse.json(
        { message: "Face capture evidence is required" },
        { status: 400 },
      );
    }

    const today = new Date();
    const attendanceDay = getJakartaDayKey(today);

    const attendance = await prisma.attendance.findFirst({
      where: {
        ...(finalTenantId ? { tenantId: finalTenantId } : {}),
        userId,
        attendanceDay,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "You have not checked in today" },
        { status: 404 },
      );
    }

    if (!attendance.checkIn) {
      return NextResponse.json(
        { message: "Attendance record is incomplete: check-in is missing" },
        { status: 409 },
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { message: "Already checked out today" },
        { status: 409 },
      );
    }

    const now = new Date();
    const checkOutFaceImage = await uploadBase64ToMinio(
      faceCaptureBase64,
      `attendance-face/check-out-${randomUUID()}.jpg`,
      BUCKET_AVATARS,
      "image/jpeg",
    );

    // hitung jam kerja
    const checkInTime = new Date(attendance.checkIn!);
    const diffMs = now.getTime() - checkInTime.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const formattedWorkHours = `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}`;

    const cfg =
      (await prisma.attendanceConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ??
      DEFAULT_CONFIG;
    const officeEnd = getDateAtTime(now, cfg.officeEndTime);
    const isHalfDay = now < officeEnd;
    const wasLate = attendance.status === "Late";
    let status: string;
    if (wasLate && isHalfDay) {
      status = "Late - Half Day";
    } else if (wasLate && !isHalfDay) {
      status = "Late - Present";
    } else if (!wasLate && isHalfDay) {
      status = "Half Day";
    } else {
      status = "Present";
    }

    const updated = await prisma.$transaction(async (tx) => {
      return tx.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now.toISOString(),
          autoCheckout: false,
          status,
          workHours: formattedWorkHours,
          checkOutLocation,
          checkOutFaceImage,
        },
      });
    });

    return NextResponse.json({
      message: "Check Out successful",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check out";
    return NextResponse.json(
      { message },
      { status: 500 },
    );
  }
}
