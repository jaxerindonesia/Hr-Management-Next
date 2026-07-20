export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

function getDurationMinutes(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

async function hasOverlappingOvertime(params: {
  userId: string;
  tenantId: string | null;
  startTime: Date;
  endTime: Date;
  excludeId?: string;
}) {
  const overlapping = await prisma.overtime.findFirst({
    where: {
      userId: params.userId,
      ...(params.tenantId ? { tenantId: params.tenantId } : { tenantId: null }),
      ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
      startTime: { lt: params.endTime },
      endTime: { gt: params.startTime },
    },
    select: { id: true },
  });

  return Boolean(overlapping);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "overtimes", "create");
    if (forbid) return forbid;

    const body = await req.json();
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdmin = ["superadmin", "admin"].includes(normalizedRole);
    const overtimeDate = String(body.overtimeDate || "");
    const start = String(body.startTime || "");
    const end = String(body.endTime || "");
    const requestedUserId = String(body.userId || "").trim();

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalUserId = isAdmin && requestedUserId ? requestedUserId : auth.user.id;
    const finalTenantId = scopedTenantId ?? null;

    if (!overtimeDate || !start || !end) {
      return NextResponse.json({ message: "Tanggal, jam mulai, dan jam selesai wajib diisi" }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: finalUserId,
        deletedAt: null,
        ...(finalTenantId ? { tenantId: finalTenantId } : {}),
      },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { message: "User target tidak ditemukan" },
        { status: 404 },
      );
    }

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
    const endTime = buildDateTime(overtimeDate, end);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return NextResponse.json({ message: "Format tanggal atau jam tidak valid" }, { status: 400 });
    }
    if (endTime <= startTime) {
      return NextResponse.json(
        { message: "Jam selesai harus setelah jam mulai" },
        { status: 400 },
      );
    }

    const overtimeMinutes = getDurationMinutes(startTime, endTime);

    if (overtimeMinutes <= 0) {
      return NextResponse.json({ message: "Durasi lembur harus lebih dari 0 menit" }, { status: 400 });
    }

    const overlapping = await hasOverlappingOvertime({
      userId: finalUserId,
      tenantId: finalTenantId,
      startTime,
      endTime,
    });
    if (overlapping) {
      return NextResponse.json(
        { message: "Sudah ada pengajuan lembur lain yang tumpang tindih pada rentang waktu tersebut" },
        { status: 409 },
      );
    }

    const overtime = await prisma.overtime.create({
      data: {
        tenantId: finalTenantId,
        userId: finalUserId,
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
