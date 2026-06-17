export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

const DEFAULT_ATTENDANCE_CONFIG = {
  officeEndTime: "17:00",
  workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
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
    const attendanceId = String(body.attendanceId || "");
    if (!attendanceId) {
      return NextResponse.json({ message: "Attendance wajib dipilih" }, { status: 400 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdmin = ["superadmin", "admin"].includes(normalizedRole);

    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
        ...(isAdmin ? {} : { userId: auth.user.id }),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        checkIn: true,
        checkOut: true,
        notes: true,
      },
    });

    if (!attendance) {
      return NextResponse.json({ message: "Data kehadiran tidak ditemukan" }, { status: 404 });
    }
    if (!attendance.checkIn || !attendance.checkOut) {
      return NextResponse.json({ message: "Lembur hanya bisa diajukan setelah check out" }, { status: 400 });
    }

    const existing = await prisma.overtime.findUnique({
      where: { attendanceId },
      select: { id: true, status: true },
    });
    if (existing) {
      return NextResponse.json({ message: `Lembur untuk attendance ini sudah diajukan (${existing.status})` }, { status: 409 });
    }

    const finalTenantId = attendance.tenantId ?? scopedTenantId ?? null;
    const attendanceCfg =
      (await prisma.attendanceConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ?? DEFAULT_ATTENDANCE_CONFIG;
    const overtimeCfg =
      (await prisma.overtimeConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ?? DEFAULT_OVERTIME_CONFIG;

    const checkIn = new Date(attendance.checkIn);
    const checkOut = new Date(attendance.checkOut);
    const officeEnd = getDateAtTime(checkOut, attendanceCfg.officeEndTime);
    const isWorkingDay = (attendanceCfg.workingDays || []).includes(getJakartaWeekday(checkOut));
    const startTime = isWorkingDay
      ? new Date(officeEnd.getTime() + Number(overtimeCfg.overtimeBuffer || 0) * 60 * 1000)
      : checkIn;
    const overtimeMinutes = isWorkingDay
      ? getDurationMinutes(startTime, checkOut)
      : getDurationMinutes(checkIn, checkOut);

    if (overtimeMinutes <= 0) {
      return NextResponse.json({ message: "Tidak ada durasi lembur yang bisa diajukan" }, { status: 400 });
    }

    const payoutAmount =
      overtimeCfg.payMethod === "PER_DAY"
        ? Number(overtimeCfg.dailyRate || 0)
        : Number(overtimeCfg.hourlyRate || 0) * (overtimeMinutes / 60);

    const overtime = await prisma.overtime.create({
      data: {
        tenantId: finalTenantId,
        userId: attendance.userId,
        attendanceId: attendance.id,
        overtimeDate: checkOut,
        startTime,
        endTime: checkOut,
        overtimeMinutes,
        requestedMinutes: overtimeMinutes,
        description: String(body.description || attendance.notes || "").trim() || null,
        payMethod: overtimeCfg.payMethod,
        hourlyRate: Number(overtimeCfg.hourlyRate || 0),
        dailyRate: Number(overtimeCfg.dailyRate || 0),
        payoutAmount,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true } },
        attendance: { select: { id: true, date: true, checkIn: true, checkOut: true } },
      },
    });

    return NextResponse.json({ message: "Pengajuan lembur berhasil dibuat", data: overtime }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Gagal mengajukan lembur" }, { status: 500 });
  }
}
