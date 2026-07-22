export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getOrSetRedisJsonCache } from "@/lib/cache/redis";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import {
  isAbsentAttendanceStatus,
  isWorkedAttendanceStatus,
} from "@/lib/helper/attendance-status";

function normalizeRoleKey(roleName: string) {
  const normalized = roleName.toLowerCase().replace(/\s/g, "");

  if (normalized === "superadmin") return "super_admin" as const;
  if (normalized === "admin") return "admin" as const;
  if (normalized === "finance") return "finance" as const;

  return "employee" as const;
}

function getDayRange(offset = 0) {
  const start = new Date();
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function getMonthsBack(totalMonths: number) {
  const months: { label: string; end: Date }[] = [];
  const now = new Date();

  for (let i = totalMonths - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

    months.push({
      label: start.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      end,
    });
  }

  return months;
}

async function buildAttendanceChart(where: Record<string, unknown>) {
  const last7Days: { date: string; hadir: number; absen: number }[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const { start, end } = getDayRange(-i);

    const attendances = await prisma.attendance.findMany({
      where: {
        ...where,
        date: { gte: start, lt: end },
      },
      select: {
        status: true,
      },
    });

    const hadir = attendances.filter((attendance) =>
      isWorkedAttendanceStatus(attendance.status),
    ).length;
    const absen = attendances.filter((attendance) =>
      isAbsentAttendanceStatus(attendance.status),
    ).length;

    last7Days.push({
      date: start.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
      }),
      hadir,
      absen,
    });
  }

  return last7Days;
}

async function buildDepartmentDist(where: Record<string, unknown>) {
  const users = await prisma.user.findMany({
    where,
    select: {
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  const departmentMap: Record<string, number> = {};

  for (const user of users) {
    const departmentName = user.department?.name ?? "Lainnya";
    departmentMap[departmentName] = (departmentMap[departmentName] ?? 0) + 1;
  }

  return Object.entries(departmentMap).map(([name, value]) => ({ name, value }));
}

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const roleKey = normalizeRoleKey(auth.user.roleName);
    const scopedTenantId = ensureTenantScope(auth.user);
    const tenantWhere = scopedTenantId ? { tenantId: scopedTenantId } : {};
    const { start: todayStart, end: todayEnd } = getDayRange();
    const { start: monthStart, end: monthEnd } = getMonthRange();

    const data = await getOrSetRedisJsonCache(
      `dashboard:${roleKey}:${scopedTenantId ?? "global"}:${auth.user.id}`,
      60,
      async () => {
        if (roleKey === "super_admin") {
          const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const next60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
          const [
            totalTenants,
            activeTenants,
            totalKaryawan,
            karyawanAktif,
            pendingSubmissions,
            totalDepartments,
            tenants,
            recentAttendancesByTenant,
            recentSubmissionsByTenant,
            recentOvertimesByTenant,
            recentReimbursementsByTenant,
            recentPerformancesByTenant,
            recentTasksByTenant,
            expiringTenantsRaw,
            tenantCreatedRaw,
            employeeCreatedRaw,
          ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { isActive: true } }),
            prisma.user.count(),
            prisma.user.count({ where: { status: "active" } }),
            prisma.submission.count({ where: { status: { in: ["PENDING", "pending"] } } }),
            prisma.department.count(),
            prisma.tenant.findMany({
              select: {
                id: true,
                companyName: true,
                users: { select: { status: true } },
                _count: { select: { departments: true } },
              },
            }),
            prisma.attendance.groupBy({
              by: ["tenantId"],
              where: {
                tenantId: { not: null },
                createdAt: { gte: last30Days },
              },
              _count: { _all: true },
            }),
            prisma.submission.groupBy({
              by: ["tenantId"],
              where: {
                tenantId: { not: null },
                createdAt: { gte: last30Days },
              },
              _count: { _all: true },
            }),
            prisma.overtime.groupBy({
              by: ["tenantId"],
              where: {
                tenantId: { not: null },
                createdAt: { gte: last30Days },
              },
              _count: { _all: true },
            }),
            prisma.reimbursement.groupBy({
              by: ["tenantId"],
              where: {
                tenantId: { not: null },
                createdAt: { gte: last30Days },
              },
              _count: { _all: true },
            }),
            prisma.performance.groupBy({
              by: ["tenantId"],
              where: {
                tenantId: { not: null },
                createdAt: { gte: last30Days },
              },
              _count: { _all: true },
            }),
            prisma.task.groupBy({
              by: ["tenantId"],
              where: {
                tenantId: { not: null },
                createdAt: { gte: last30Days },
              },
              _count: { _all: true },
            }),
            prisma.tenant.findMany({
              where: {
                isActive: true,
                subscriptionEnd: {
                  gte: new Date(),
                  lte: next60Days,
                },
              },
              orderBy: { subscriptionEnd: "asc" },
              take: 5,
              select: {
                id: true,
                companyName: true,
                subscriptionEnd: true,
                isActive: true,
                _count: { select: { users: true } },
              },
            }),
            prisma.tenant.findMany({ select: { createdAt: true } }),
            prisma.user.findMany({ select: { createdAt: true } }),
          ]);

          const attendanceActivityMap = new Map(
            recentAttendancesByTenant.map((item) => [item.tenantId, item._count._all]),
          );
          const submissionActivityMap = new Map(
            recentSubmissionsByTenant.map((item) => [item.tenantId, item._count._all]),
          );
          const overtimeActivityMap = new Map(
            recentOvertimesByTenant.map((item) => [item.tenantId, item._count._all]),
          );
          const reimbursementActivityMap = new Map(
            recentReimbursementsByTenant.map((item) => [item.tenantId, item._count._all]),
          );
          const performanceActivityMap = new Map(
            recentPerformancesByTenant.map((item) => [item.tenantId, item._count._all]),
          );
          const taskActivityMap = new Map(
            recentTasksByTenant.map((item) => [item.tenantId, item._count._all]),
          );

          const topTenants = tenants
            .map((tenant) => {
              const employeeCount = tenant.users.length;
              const activeEmployeeCount = tenant.users.filter((user) => user.status === "active").length;

              return {
                id: tenant.id,
                companyName: tenant.companyName,
                employeeCount,
                activeEmployeeCount,
                departmentCount: tenant._count.departments,
                activeEmployeeRate: employeeCount > 0 ? Math.round((activeEmployeeCount / employeeCount) * 100) : 0,
              };
            })
            .sort((left, right) => {
              if (right.employeeCount !== left.employeeCount) return right.employeeCount - left.employeeCount;
              return right.activeEmployeeRate - left.activeEmployeeRate;
            })
            .slice(0, 5);

          const activeTenantItems = tenants
            .map((tenant) => {
              const attendanceCount = attendanceActivityMap.get(tenant.id) ?? 0;
              const submissionCount = submissionActivityMap.get(tenant.id) ?? 0;
              const overtimeCount = overtimeActivityMap.get(tenant.id) ?? 0;
              const reimbursementCount = reimbursementActivityMap.get(tenant.id) ?? 0;
              const performanceCount = performanceActivityMap.get(tenant.id) ?? 0;
              const taskCount = taskActivityMap.get(tenant.id) ?? 0;

              return {
                id: tenant.id,
                companyName: tenant.companyName,
                activityCount:
                  attendanceCount +
                  submissionCount +
                  overtimeCount +
                  reimbursementCount +
                  performanceCount +
                  taskCount,
                attendanceCount,
                submissionCount,
                overtimeCount,
                reimbursementCount,
                performanceCount,
                taskCount,
              };
            })
            .sort((left, right) => right.activityCount - left.activityCount)
            .slice(0, 5);

          const expiringTenants = expiringTenantsRaw.map((tenant) => ({
            id: tenant.id,
            companyName: tenant.companyName,
            subscriptionEnd: tenant.subscriptionEnd?.toISOString() ?? null,
            daysRemaining: tenant.subscriptionEnd
              ? Math.max(0, Math.ceil((tenant.subscriptionEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
              : null,
            employeeCount: tenant._count.users,
            isActive: tenant.isActive,
          }));

          const monthBuckets = getMonthsBack(12);
          const tenantGrowthMonthly = monthBuckets.map((month) => ({
            label: month.label,
            tenants: tenantCreatedRaw.filter((tenant) => tenant.createdAt < month.end).length,
            employees: employeeCreatedRaw.filter((user) => user.createdAt < month.end).length,
          }));

          const yearlyBuckets = Array.from(
            new Set([
              ...tenantCreatedRaw.map((tenant) => tenant.createdAt.getFullYear()),
              ...employeeCreatedRaw.map((user) => user.createdAt.getFullYear()),
              new Date().getFullYear(),
            ]),
          )
            .sort((left, right) => left - right)
            .map((year) => ({
              label: String(year),
              end: new Date(year + 1, 0, 1),
            }));

          const tenantGrowthYearly = yearlyBuckets.map((year) => ({
            label: year.label,
            tenants: tenantCreatedRaw.filter((tenant) => tenant.createdAt < year.end).length,
            employees: employeeCreatedRaw.filter((user) => user.createdAt < year.end).length,
          }));

          return {
            roleName: auth.user.roleName,
            roleKey,
            subtitle: "Pantau pertumbuhan tenant, persebaran karyawan, dan aktivitas lintas perusahaan dari satu layar.",
            summaryCards: [
              { title: "Total Tenant", value: totalTenants, sub: `${activeTenants} tenant aktif`, tone: "blue", icon: "building" },
              { title: "Total Karyawan", value: totalKaryawan, sub: `${karyawanAktif} karyawan aktif`, tone: "emerald", icon: "users" },
              { title: "Total Departemen", value: totalDepartments, sub: "Seluruh tenant", tone: "violet", icon: "briefcase" },
              { title: "Pengajuan Pending", value: pendingSubmissions, sub: "Menunggu persetujuan", tone: "orange", icon: "clipboard" },
            ],
            stats: {
              totalKaryawan,
              karyawanAktif,
              pendingSubmissions,
              totalGajiBulanIni: 0,
            },
            attendanceChart: [],
            departmentDist: [],
            recentSubmissions: [],
            newEmployees: [],
            topTenants,
            activeTenants: activeTenantItems,
            expiringTenants,
            tenantGrowthMonthly,
            tenantGrowthYearly,
            recentAttendances: [],
            recentJournals: [],
          };
        }

        if (roleKey === "finance") {
          const journalWhere = scopedTenantId
            ? { creator: { tenantId: scopedTenantId } }
            : {};
          const [
            totalAccounts,
            postedJournals,
            draftJournals,
            pendingPettyCash,
            customerCount,
            vendorCount,
            recentJournals,
          ] = await Promise.all([
            prisma.account.count({ where: tenantWhere }),
            prisma.journal.count({ where: { ...journalWhere, status: "POSTED" } }),
            prisma.journal.count({ where: { ...journalWhere, status: "DRAFT" } }),
            prisma.pettyCash.count({ where: { ...tenantWhere, status: { in: ["PENDING", "pending"] } } }),
            prisma.customer.count({ where: tenantWhere }),
            prisma.vendor.count({ where: tenantWhere }),
            prisma.journal.findMany({
              where: journalWhere,
              orderBy: { createdAt: "desc" },
              take: 8,
              select: {
                id: true,
                journalNo: true,
                date: true,
                status: true,
                description: true,
                details: { select: { id: true } },
              },
            }),
          ]);

          return {
            roleName: auth.user.roleName,
            roleKey,
            subtitle: "Fokus pada akun, jurnal, partner finance, dan arus kerja transaksi tenant Anda.",
            summaryCards: [
              { title: "Total Akun", value: totalAccounts, sub: "Chart of account aktif", tone: "blue", icon: "briefcase" },
              { title: "Jurnal Posted", value: postedJournals, sub: "Sudah dibukukan", tone: "emerald", icon: "check" },
              { title: "Jurnal Draft", value: draftJournals, sub: "Masih perlu ditinjau", tone: "violet", icon: "receipt" },
              { title: "Partner Finance", value: customerCount + vendorCount, sub: `${customerCount} customer · ${vendorCount} vendor`, tone: "orange", icon: "clipboard" },
            ],
            stats: {
              totalKaryawan: 0,
              karyawanAktif: 0,
              pendingSubmissions: pendingPettyCash,
              totalGajiBulanIni: 0,
            },
            attendanceChart: [],
            departmentDist: [],
            recentSubmissions: [],
            newEmployees: [],
            topTenants: [],
            activeTenants: [],
            expiringTenants: [],
            tenantGrowthMonthly: [],
            tenantGrowthYearly: [],
            recentAttendances: [],
            recentJournals: recentJournals.map((journal) => ({
              id: journal.id,
              journalNo: journal.journalNo,
              date: journal.date.toISOString(),
              status: journal.status,
              description: journal.description,
              totalLines: journal.details.length,
            })),
          };
        }

        if (roleKey === "employee") {
          const [
            todayAttendance,
            monthAttendances,
            pendingSubmissions,
            pendingOvertimes,
            attendanceChart,
            recentSubmissionsRaw,
            recentAttendancesRaw,
          ] = await Promise.all([
            prisma.attendance.findFirst({
              where: {
                userId: auth.user.id,
                ...tenantWhere,
                date: { gte: todayStart, lt: todayEnd },
              },
              orderBy: { date: "desc" },
            }),
            prisma.attendance.findMany({
              where: {
                userId: auth.user.id,
                ...tenantWhere,
                date: { gte: monthStart, lt: monthEnd },
              },
              select: { status: true },
            }),
            prisma.submission.count({
              where: {
                userId: auth.user.id,
                ...tenantWhere,
                status: { in: ["PENDING", "pending"] },
              },
            }),
            prisma.overtime.count({
              where: {
                userId: auth.user.id,
                ...tenantWhere,
                status: { in: ["PENDING", "pending"] },
              },
            }),
            buildAttendanceChart({ userId: auth.user.id, ...tenantWhere }),
            prisma.submission.findMany({
              where: { userId: auth.user.id, ...tenantWhere },
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                user: { select: { name: true } },
                submissionType: { select: { name: true } },
              },
            }),
            prisma.attendance.findMany({
              where: { userId: auth.user.id, ...tenantWhere },
              orderBy: { date: "desc" },
              take: 7,
              select: {
                id: true,
                date: true,
                status: true,
                checkIn: true,
                checkOut: true,
                workHours: true,
              },
            }),
          ]);

          const monthlyPresent = monthAttendances.filter((attendance) =>
            isWorkedAttendanceStatus(attendance.status),
          ).length;
          const monthlyAbsent = monthAttendances.filter((attendance) =>
            isAbsentAttendanceStatus(attendance.status),
          ).length;

          const todayStatus = todayAttendance?.status ?? "Belum Absen";

          return {
            roleName: auth.user.roleName,
            roleKey,
            subtitle: "Lihat ringkasan kehadiran, pengajuan, dan aktivitas kerja pribadi Anda secara cepat.",
            summaryCards: [
              { title: "Status Hari Ini", value: todayStatus, sub: "Absensi harian Anda", tone: "blue", icon: "clock" },
              { title: "Hadir Bulan Ini", value: monthlyPresent, sub: `${monthlyAbsent} kali absen`, tone: "emerald", icon: "check" },
              { title: "Pengajuan Pending", value: pendingSubmissions, sub: "Menunggu keputusan", tone: "orange", icon: "clipboard" },
              { title: "Lembur Pending", value: pendingOvertimes, sub: "Menunggu approval", tone: "violet", icon: "receipt" },
            ],
            stats: {
              totalKaryawan: 0,
              karyawanAktif: 0,
              pendingSubmissions,
              totalGajiBulanIni: 0,
            },
            attendanceChart,
            departmentDist: [],
            recentSubmissions: recentSubmissionsRaw,
            newEmployees: [],
            topTenants: [],
            activeTenants: [],
            expiringTenants: [],
            tenantGrowthMonthly: [],
            tenantGrowthYearly: [],
            recentAttendances: recentAttendancesRaw.map((attendance) => ({
              id: attendance.id,
              date: attendance.date.toISOString(),
              status: attendance.status,
              checkIn: attendance.checkIn?.toISOString() ?? null,
              checkOut: attendance.checkOut?.toISOString() ?? null,
              workHours: attendance.workHours ?? null,
            })),
            recentJournals: [],
          };
        }

        const [
          totalKaryawan,
          karyawanAktif,
          pendingSubmissions,
          totalDepartments,
          attendanceChart,
          departmentDist,
          recentSubmissionsRaw,
          newEmployeesRaw,
        ] = await Promise.all([
          prisma.user.count({ where: tenantWhere }),
          prisma.user.count({ where: { ...tenantWhere, status: "active" } }),
          prisma.submission.count({ where: { ...tenantWhere, status: { in: ["PENDING", "pending"] } } }),
          prisma.department.count({ where: tenantWhere }),
          buildAttendanceChart(tenantWhere),
          buildDepartmentDist(tenantWhere),
          prisma.submission.findMany({
            where: tenantWhere,
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              user: { select: { name: true } },
              submissionType: { select: { name: true } },
            },
          }),
          prisma.user.findMany({
            where: tenantWhere,
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              name: true,
              position: true,
              joinDate: true,
              status: true,
              department: { select: { name: true } },
            },
          }),
        ]);

        const newEmployees = newEmployeesRaw.map((user) => ({
          id: user.id,
          name: user.name,
          position: user.position,
          joinDate: user.joinDate,
          status: user.status,
          department: user.department?.name ?? null,
        }));

        return {
          roleName: auth.user.roleName,
          roleKey,
          subtitle: "Pantau karyawan tenant Anda, distribusi departemen, dan pengajuan yang perlu segera ditindaklanjuti.",
          summaryCards: [
            { title: "Total Karyawan", value: totalKaryawan, sub: "Karyawan di tenant Anda", tone: "blue", icon: "users" },
            { title: "Karyawan Aktif", value: karyawanAktif, sub: `${totalKaryawan - karyawanAktif} tidak aktif`, tone: "emerald", icon: "check" },
            { title: "Total Departemen", value: totalDepartments, sub: "Struktur organisasi aktif", tone: "violet", icon: "briefcase" },
            { title: "Pengajuan Pending", value: pendingSubmissions, sub: "Perlu ditinjau", tone: "orange", icon: "clipboard" },
          ],
          stats: {
            totalKaryawan,
            karyawanAktif,
            pendingSubmissions,
            totalGajiBulanIni: 0,
          },
          attendanceChart,
          departmentDist,
          recentSubmissions: recentSubmissionsRaw,
          newEmployees,
          topTenants: [],
          activeTenants: [],
          expiringTenants: [],
          tenantGrowthMonthly: [],
          tenantGrowthYearly: [],
          recentAttendances: [],
          recentJournals: [],
        };
      },
    );

    return NextResponse.json({
      message: "Dashboard data retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET DASHBOARD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to retrieve dashboard data" },
      { status: 500 },
    );
  }
}
