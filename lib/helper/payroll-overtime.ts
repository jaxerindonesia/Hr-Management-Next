import prisma from "@/lib/prisma";
import { AUTO_OVERTIME_COMPONENT_NAME } from "@/lib/constants/payroll";

export async function getApprovedOvertimePayoutSummary(params: {
  tenantId?: string | null;
  userId: string;
  month: number;
  year: number;
}) {
  const { tenantId, userId, month, year } = params;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const aggregates = await prisma.overtime.aggregate({
    where: {
      userId,
      status: "APPROVED",
      payoutAmount: { gt: 0 },
      overtimeDate: {
        gte: startDate,
        lt: endDate,
      },
      ...(tenantId ? { tenantId } : { tenantId: null }),
    },
    _sum: {
      payoutAmount: true,
      overtimeMinutes: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalAmount: Number(aggregates._sum.payoutAmount || 0),
    totalMinutes: Number(aggregates._sum.overtimeMinutes || 0),
    totalEntries: Number(aggregates._count.id || 0),
  };
}
