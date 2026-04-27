export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

const DEFAULT_CONFIG = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
  workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
};

const VALID_WORKING_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const cfg = await prisma.attendanceConfig.findFirst({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      message: "OK",
      data: cfg ?? DEFAULT_CONFIG,
      isDefault: !cfg,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch attendance config" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const body = await req.json();
    const officeStartTime = String(body.officeStartTime || "").trim();
    const officeEndTime = String(body.officeEndTime || "").trim();
    const lateToleranceMinutes = Number(body.lateToleranceMinutes);
    const workingDaysInput = Array.isArray(body.workingDays) ? body.workingDays : [];
    const workingDays = [
      ...new Set(
        workingDaysInput
          .map((d) => String(d || "").trim().toUpperCase())
          .filter((d): d is (typeof VALID_WORKING_DAYS)[number] =>
            VALID_WORKING_DAYS.includes(d as (typeof VALID_WORKING_DAYS)[number]),
          ),
      ),
    ];

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(officeStartTime) || !timeRegex.test(officeEndTime)) {
      return NextResponse.json(
        { message: "Format jam harus HH:mm" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(lateToleranceMinutes) || lateToleranceMinutes < 0) {
      return NextResponse.json(
        { message: "Toleransi keterlambatan harus angka >= 0" },
        { status: 400 },
      );
    }
    if (workingDays.length === 0) {
      return NextResponse.json(
        { message: "Minimal pilih 1 hari masuk kerja" },
        { status: 400 },
      );
    }

    const existing = await prisma.attendanceConfig.findFirst({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { updatedAt: "desc" },
    });

    const data = {
      officeStartTime,
      officeEndTime,
      lateToleranceMinutes,
      workingDays,
      ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
    };

    const saved = existing
      ? await prisma.attendanceConfig.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.attendanceConfig.create({ data });

    return NextResponse.json({
      message: "Attendance config updated",
      data: saved,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update attendance config" },
      { status: 500 },
    );
  }
}
