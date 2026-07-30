import prisma from "@/lib/prisma";
import { isWorkedAttendanceStatus } from "@/lib/helper/attendance-status";
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

  if (salaryType === "monthly") {
    return {
      salaryType,
      tenantId: user.tenantId,
      salaryRate,
      paidAttendanceDays: 0,
      basicSalary: salaryRate,
    };
  }

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

  return {
    salaryType,
    tenantId: user.tenantId,
    salaryRate,
    paidAttendanceDays,
    basicSalary: salaryRate * paidAttendanceDays,
  };
}
