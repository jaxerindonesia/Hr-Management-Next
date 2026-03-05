export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Last 7 days for attendance chart
    const last7Days: { date: string; hadir: number; absen: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const [hadir, absen] = await Promise.all([
        prisma.attendance.count({
          where: {
            date: { gte: d, lt: nextD },
            status: "Present",
          },
        }),
        prisma.attendance.count({
          where: {
            date: { gte: d, lt: nextD },
            status: { not: "Present" },
          },
        }),
      ]);

      last7Days.push({
        date: d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        }),
        hadir,
        absen,
      });
    }

    // Stat cards
    const [totalKaryawan, karyawanAktif, pendingSubmissions] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "active" } }),
        prisma.submission.count({ where: { status: "pending" } }),
      ]);

    // Total gaji bulan ini (paid) — month is stored as Int
    const gajiAggregate = await prisma.payroll.aggregate({
      _sum: { totalSalary: true },
      where: { month: currentMonth, year: currentYear, status: "paid" },
    });
    const totalGajiBulanIni = gajiAggregate._sum.totalSalary ?? 0;

    // Department distribution
    const users = await prisma.user.findMany({
      select: { department: true },
    });
    const deptMap: Record<string, number> = {};
    for (const u of users) {
      const dept = u.department ?? "Lainnya";
      deptMap[dept] = (deptMap[dept] ?? 0) + 1;
    }
    const departmentDist = Object.entries(deptMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Recent submissions (latest 5)
    const recentSubmissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true } },
        submissionType: { select: { name: true } },
      },
    });

    // Latest employees joined (latest 5)
    const newEmployees = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        joinDate: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: "Dashboard data retrieved successfully",
      data: {
        stats: {
          totalKaryawan,
          karyawanAktif,
          pendingSubmissions,
          totalGajiBulanIni,
        },
        attendanceChart: last7Days,
        departmentDist,
        recentSubmissions,
        newEmployees,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve dashboard data" },
      { status: 500 },
    );
  }
}
