import prisma from "@/lib/prisma";
import {
  isLateAttendanceStatus,
  isWorkedAttendanceStatus,
} from "@/lib/helper/attendance-status";
import type { PayrollSalarySummaryDto } from "@/lib/dto/payroll-calculation";

export async function getPayrollSalarySummary(params: {
  tenantId?: string | null;
  userId: string;
  month: number;
  year: number;
}): Promise<PayrollSalarySummaryDto & { tenantId: string | null }> {
  const { tenantId, userId, month, year } = params;
  if (!userId || month < 1 || month > 12 || year < 1) {
    throw new Error("Periode payroll tidak valid");
  }
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      ...(tenantId ? { tenantId } : {}),
    },
    select: {
      salary: true,
      salaryType: true,
      tenantId: true,
    },
  });

  if (!user) {
    throw new Error("Karyawan tidak ditemukan");
  }

  const salaryRate = Number(user.salary || 0);
  const salaryType = user.salaryType === "daily" ? "daily" : "monthly";

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      attendanceDay: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: { status: true },
  });
  const paidAttendanceDays = attendances.filter((attendance) =>
    isWorkedAttendanceStatus(attendance.status),
  ).length;
  const lateAttendanceDays = attendances.filter((attendance) =>
    isLateAttendanceStatus(attendance.status),
  ).length;
  const attendanceConfig = await prisma.attendanceConfig.findFirst({
    where: { tenantId: user.tenantId },
    orderBy: { updatedAt: "desc" },
    select: { lateDeductionAmount: true },
  });
  const lateDeductionRate = Number(attendanceConfig?.lateDeductionAmount || 0);

  return {
    salaryType,
    tenantId: user.tenantId,
    salaryRate,
    paidAttendanceDays: salaryType === "daily" ? paidAttendanceDays : 0,
    basicSalary:
      salaryType === "daily" ? salaryRate * paidAttendanceDays : salaryRate,
    lateDeductionRate,
    lateAttendanceDays,
    lateDeductionAmount: lateDeductionRate * lateAttendanceDays,
  };
}
