export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

function getDurationMinutes(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const overtimeDate = String(body.overtimeDate || "");
    const start = String(body.startTime || "");
    const end = String(body.endTime || "");

    const scopedTenantId = ensureTenantScope(auth.user);

    if (!overtimeDate || !start || !end) {
      return NextResponse.json({ message: "Tanggal, jam mulai, dan jam selesai wajib diisi" }, { status: 400 });
    }

    const finalTenantId = scopedTenantId ?? null;
    const approverConfigs = await prisma.overtimeApproverConfig.findMany({
      where: finalTenantId ? { tenantId: finalTenantId } : { tenantId: null },
      select: { approverUserId: true },
    });
    let approverUserIds = approverConfigs.map((cfg) => cfg.approverUserId);
    if (approverUserIds.length === 0) {
      const defaultApprovers = await prisma.user.findMany({
        where: {
          ...(finalTenantId ? { tenantId: finalTenantId } : {}),
          role: { name: { in: ["Admin", "Super Admin"] } },
        },
        select: { id: true },
      });
      approverUserIds = defaultApprovers.map((u) => u.id);
    }
    if (approverUserIds.length === 0) {
      return NextResponse.json({ message: "Belum ada approver lembur yang dikonfigurasi" }, { status: 400 });
    }

    const startTime = buildDateTime(overtimeDate, start);
    let endTime = buildDateTime(overtimeDate, end);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return NextResponse.json({ message: "Format tanggal atau jam tidak valid" }, { status: 400 });
    }
    if (endTime <= startTime) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }

    const overtimeMinutes = getDurationMinutes(startTime, endTime);

    if (overtimeMinutes <= 0) {
      return NextResponse.json({ message: "Durasi lembur harus lebih dari 0 menit" }, { status: 400 });
    }

    const overtime = await prisma.overtime.create({
      data: {
        tenantId: finalTenantId,
        userId: auth.user.id,
        attendanceId: null,
        overtimeDate: startTime,
        startTime,
        endTime,
        overtimeMinutes,
        requestedMinutes: overtimeMinutes,
        description: String(body.description || "").trim() || null,
        payMethod: "PER_HOUR",
        hourlyRate: 0,
        dailyRate: 0,
        payoutAmount: 0,
        status: "PENDING",
        approvalDecisions: {
          createMany: {
            data: approverUserIds.map((approverUserId) => ({ approverUserId, status: "PENDING" })),
          },
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        attendance: { select: { id: true, date: true, checkIn: true, checkOut: true } },
        approvalDecisions: true,
      },
    });

    return NextResponse.json({ message: "Pengajuan lembur berhasil dibuat", data: overtime }, { status: 201 });
  } catch (error) {
    console.error("CREATE OVERTIME REQUEST ERROR:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengajukan lembur",
      },
      { status: 500 },
    );
  }
}
