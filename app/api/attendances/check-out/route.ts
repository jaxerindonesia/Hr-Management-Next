export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { BUCKET_AVATARS, uploadBase64ToMinio } from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

const DEFAULT_CONFIG = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
};

const DEFAULT_OVERTIME_CONFIG = {
  payMethod: "PER_HOUR",
  hourlyRate: 0,
  dailyRate: 0,
  overtimeBuffer: 60,
};

const WEEKDAY_MAP = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function getDateAtTime(baseDate: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function getDurationMinutes(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
}

function getJakartaWeekday(date: Date) {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return WEEKDAY_MAP[shifted.getUTCDay()];
}

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
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendance.findFirst({
      where: {
        ...(finalTenantId ? { tenantId: finalTenantId } : {}),
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "You have not checked in today" },
        { status: 404 },
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
    const overtimeCfg =
      (await prisma.overtimeConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ??
      DEFAULT_OVERTIME_CONFIG;
    const officeEnd = getDateAtTime(now, cfg.officeEndTime);
    const isHalfDay = now < officeEnd;
    const wasLate = attendance.status === "Late";
    const isWorkingDay = (cfg.workingDays || []).includes(getJakartaWeekday(now));

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

    const overtimeStart = isWorkingDay
      ? new Date(officeEnd.getTime() + overtimeCfg.overtimeBuffer * 60 * 1000)
      : new Date(attendance.checkIn!);
    const overtimeMinutes = isWorkingDay
      ? getDurationMinutes(overtimeStart, now)
      : getDurationMinutes(new Date(attendance.checkIn!), now);
    const requestedMinutes = overtimeMinutes;
    const payoutAmount =
      overtimeCfg.payMethod === "PER_DAY"
        ? Number(overtimeCfg.dailyRate || 0)
        : Number(overtimeCfg.hourlyRate || 0) * (overtimeMinutes / 60);

    const updated = await prisma.attendance.update({
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

    if (overtimeMinutes > 0) {
      await prisma.overtime.upsert({
        where: { attendanceId: attendance.id },
        create: {
          tenantId: finalTenantId,
          userId: attendance.userId,
          attendanceId: attendance.id,
          overtimeDate: new Date(now),
          startTime: overtimeStart,
          endTime: now,
          overtimeMinutes,
          requestedMinutes,
          description: attendance.notes ?? null,
          payMethod: overtimeCfg.payMethod,
          hourlyRate: Number(overtimeCfg.hourlyRate || 0),
          dailyRate: Number(overtimeCfg.dailyRate || 0),
          payoutAmount,
          status: "PENDING",
        },
        update: {
          overtimeDate: new Date(now),
          startTime: overtimeStart,
          endTime: now,
          overtimeMinutes,
          requestedMinutes,
          payMethod: overtimeCfg.payMethod,
          hourlyRate: Number(overtimeCfg.hourlyRate || 0),
          dailyRate: Number(overtimeCfg.dailyRate || 0),
          payoutAmount,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({
      message: "Check Out successful",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to check out" },
      { status: 500 },
    );
  }
}
