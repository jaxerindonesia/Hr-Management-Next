export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // 1. Ambil info user
    const user = await prisma.user.findFirst({
      where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 2. Ambil data kehadiran untuk bulan & tahun tersebut
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    // 3. Hitung summary kehadiran
    const summary = {
      totalHadir: 0,
      totalTelat: 0,
      totalAlpha: 0,
      totalIzin: 0,
    };

    attendances.forEach((att) => {
      const s = att.status?.toLowerCase() || "";
      if (["hadir", "present", "tepat waktu", "on time", "half day"].includes(s)) {
        summary.totalHadir++;
      } else if (["telat", "late", "terlambat", "late - present", "late - half day"].includes(s)) {
        summary.totalTelat++;
      } else if (["alpha", "absent", "tidak hadir"].includes(s)) {
        summary.totalAlpha++;
      } else if (["izin", "cuti", "sakit", "leave", "sick"].includes(s)) {
        summary.totalIzin++;
      }
    });

    // 4. Ambil kuota cuti (LeaveConfig)
    const leaveConfigs = await prisma.leaveConfig.findMany({
      where: { ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      include: {
        submissionTypes: {
          select: { id: true, name: true },
        },
      },
    });

    // Ambil semua pengajuan tahun ini untuk menghitung sisa kuota
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const yearSubmissions = await prisma.submission.findMany({
      where: {
        userId: id,
        status: "APPROVED",
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
      },
      include: { submissionType: true },
    });

    const leaveQuotas = leaveConfigs.map((config) => {
      const typeIds = config.submissionTypes.map((t) => t.id);
      const usedDays = yearSubmissions
        .filter((s) => typeIds.includes(s.submissionTypeId))
        .reduce((total, s) => {
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return total + diffDays;
        }, 0);

      return {
        configName: config.name,
        maxDays: config.maxDays,
        usedDays,
        remainingDays: Math.max(0, config.maxDays - usedDays),
      };
    });

    // 5. Riwayat pengajuan tahun ini
    const submissionsHistory = await prisma.submission.findMany({
      where: {
        userId: id,
        startDate: { gte: yearStart, lte: yearEnd },
      },
      include: { submissionType: true },
      orderBy: { createdAt: "desc" },
    });

    const history = submissionsHistory.map((s) => ({
      id: s.id,
      type: s.submissionType.name,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      reason: s.reason,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data: {
        user,
        month,
        year,
        attendance: {
          summary,
          details: attendances.map((a) => ({
            id: a.id,
            date: a.date.toISOString(),
            checkIn: a.checkIn?.toISOString() || null,
            checkOut: a.checkOut?.toISOString() || null,
            status: a.status,
            notes: a.notes,
            workHours: a.workHours,
          })),
        },
        submissions: {
          leaveQuotas,
          history,
        },
      },
    });
  } catch (error) {
    console.error("RECAP API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to retrieve recap data" },
      { status: 500 },
    );
  }
}
