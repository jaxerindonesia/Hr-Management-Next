export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const JAKARTA_UTC_OFFSET_HOURS = 7;
const DEFAULT_CONFIG = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
};

function isAuthorizedCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = req.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}

function getJakartaDayRange(nowUtc = new Date()) {
  const shifted = new Date(
    nowUtc.getTime() + JAKARTA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );

  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();

  const startUtc = new Date(
    Date.UTC(y, m, d, -JAKARTA_UTC_OFFSET_HOURS, 0, 0, 0),
  );
  const endUtc = new Date(
    Date.UTC(y, m, d, 23 - JAKARTA_UTC_OFFSET_HOURS, 59, 59, 999),
  );

  return { startUtc, endUtc };
}

function getDateAtTime(baseDate: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { startUtc, endUtc } = getJakartaDayRange();
    const autoCheckoutTime = new Date(endUtc);

    const openAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startUtc,
          lte: endUtc,
        },
        checkOut: null,
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        status: true,
        checkIn: true,
      },
    });

    const tenantIds = [
      ...new Set(openAttendances.map((attendance) => attendance.tenantId).filter(Boolean)),
    ] as string[];
    const configs = await prisma.attendanceConfig.findMany({
      where: {
        OR: [{ tenantId: { in: tenantIds } }, { tenantId: null }],
      },
      orderBy: { updatedAt: "desc" },
      select: { tenantId: true, officeEndTime: true },
    });

    const configByTenant = new Map<string, { officeEndTime: string }>();
    let globalConfig: { officeEndTime: string } | null = null;
    for (const cfg of configs) {
      const normalized = {
        officeEndTime: cfg.officeEndTime || DEFAULT_CONFIG.officeEndTime,
      };
      if (cfg.tenantId) {
        if (!configByTenant.has(cfg.tenantId)) {
          configByTenant.set(cfg.tenantId, normalized);
        }
      } else if (!globalConfig) {
        globalConfig = normalized;
      }
    }

    if (openAttendances.length === 0) {
      return NextResponse.json({
        message: "Attendance auto checkout job completed",
        updated: 0,
        targetDateStart: startUtc.toISOString(),
        targetDateEnd: endUtc.toISOString(),
      });
    }

    await prisma.$transaction(
      openAttendances.map((attendance) =>
        {
          const cfg =
            (attendance.tenantId
              ? configByTenant.get(attendance.tenantId)
              : null) || globalConfig || DEFAULT_CONFIG;
          const officeEnd = getDateAtTime(autoCheckoutTime, cfg.officeEndTime);
          const isHalfDay = autoCheckoutTime < officeEnd;
          const wasLate = attendance.status === "Late";

          let status = "Present";
          if (!attendance.checkIn) {
            status = "Absent";
          } else if (wasLate && isHalfDay) {
            status = "Late - Half Day";
          } else if (wasLate && !isHalfDay) {
            status = "Late - Present";
          } else if (!wasLate && isHalfDay) {
            status = "Half Day";
          }

          return prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              checkOut: autoCheckoutTime,
              autoCheckout: true,
              checkOutLocation: Prisma.JsonNull,
              checkOutFaceImage: null,
              workHours: attendance.checkIn
                ? (() => {
                    const diffMs =
                      autoCheckoutTime.getTime() - new Date(attendance.checkIn).getTime();
                    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
                  })()
                : "00:00",
              notes: "Auto checkout by cron at 23:59",
              status,
            },
          });
        },
      ),
    );

    return NextResponse.json({
      message: "Attendance auto checkout job completed",
      updated: openAttendances.length,
      targetDateStart: startUtc.toISOString(),
      targetDateEnd: endUtc.toISOString(),
    });
  } catch (error) {
    console.error("CRON ATTENDANCE AUTO CHECKOUT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to run attendance auto checkout job" },
      { status: 500 },
    );
  }
}
