import prisma from "@/lib/prisma";
import {
  isAbsentAttendanceStatus,
  isLateAttendanceStatus,
  isPresentAttendanceStatus,
} from "@/lib/helper/attendance-status";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToNearestIntScore(value: number) {
  return Math.round(clamp(value, 1, 5));
}

function isDoneListName(name?: string | null) {
  const normalized = String(name || "").toLowerCase();
  return ["done", "completed", "selesai"].some((keyword) =>
    normalized.includes(keyword),
  );
}

export function parsePerformancePeriod(period: string) {
  const normalized = String(period || "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return { year, month, startDate, endDate, period: normalized };
}

export async function buildPerformanceKpi(params: {
  tenantId?: string | null;
  userId: string;
  period: string;
}) {
  const parsedPeriod = parsePerformancePeriod(params.period);
  if (!parsedPeriod) {
    throw new Error("Format periode harus YYYY-MM");
  }

  const { startDate, endDate } = parsedPeriod;
  const tenantWhere = params.tenantId ? { tenantId: params.tenantId } : { tenantId: null };

  const [attendances, approvedSubmissions, tasks, approvedOvertimes] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        userId: params.userId,
        ...tenantWhere,
        attendanceDay: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        autoCheckout: true,
      },
    }),
    prisma.submission.findMany({
      where: {
        userId: params.userId,
        ...tenantWhere,
        status: "APPROVED",
        OR: [
          {
            startDate: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lt: endDate,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        ...tenantWhere,
        members: {
          some: {
            userId: params.userId,
          },
        },
        OR: [
          {
            startDate: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            updatedAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            dueDate: {
              gte: startDate,
              lt: endDate,
            },
          },
        ],
      },
      select: {
        id: true,
        dueDate: true,
        updatedAt: true,
        list: {
          select: {
            name: true,
          },
        },
        members: {
          select: {
            userId: true,
          },
        },
      },
    }),
    prisma.overtime.findMany({
      where: {
        userId: params.userId,
        ...tenantWhere,
        status: "APPROVED",
        overtimeDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        id: true,
        overtimeMinutes: true,
        payoutAmount: true,
      },
    }),
  ]);

  const attendanceCount = attendances.length;
  const presentCount = attendances.filter((item) =>
    isPresentAttendanceStatus(item.status),
  ).length;
  const lateCount = attendances.filter((item) =>
    isLateAttendanceStatus(item.status),
  ).length;
  const absentCount = attendances.filter((item) =>
    isAbsentAttendanceStatus(item.status),
  ).length;
  const autoCheckoutCount = attendances.filter((item) => item.autoCheckout).length;

  const assignedTaskCount = tasks.length;
  const completedTasks = tasks.filter((task) => isDoneListName(task.list?.name));
  const completedTaskCount = completedTasks.length;
  const collaborativeTaskCount = tasks.filter((task) => task.members.length > 1).length;
  const overdueTaskCount = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const completedAt = isDoneListName(task.list?.name) ? task.updatedAt : null;
    if (completedAt) return completedAt > task.dueDate;
    return task.dueDate < endDate;
  }).length;

  const onTimeCompletedTaskCount = completedTasks.filter((task) => {
    if (!task.dueDate) return true;
    return task.updatedAt <= task.dueDate;
  }).length;

  const approvedOvertimeCount = approvedOvertimes.length;
  const approvedOvertimeMinutes = approvedOvertimes.reduce(
    (sum, item) => sum + Number(item.overtimeMinutes || 0),
    0,
  );
  const approvedOvertimeAmount = approvedOvertimes.reduce(
    (sum, item) => sum + Number(item.payoutAmount || 0),
    0,
  );

  const hasSufficientData =
    attendanceCount > 0 ||
    approvedSubmissions.length > 0 ||
    assignedTaskCount > 0 ||
    approvedOvertimeCount > 0;

  if (!hasSufficientData) {
    return {
      period: parsedPeriod.period,
      productivity: 0,
      quality: 0,
      teamwork: 0,
      discipline: 0,
      totalScore: 0,
      kpiBreakdown: {
        hasSufficientData,
        attendanceCount,
        presentCount,
        lateCount,
        absentCount,
        autoCheckoutCount,
        approvedSubmissionCount: approvedSubmissions.length,
        assignedTaskCount,
        completedTaskCount,
        overdueTaskCount,
        collaborativeTaskCount,
        approvedOvertimeCount,
        approvedOvertimeMinutes,
        approvedOvertimeAmount,
        productivityScore: 0,
        qualityScore: 0,
        teamworkScore: 0,
        disciplineScore: 0,
      },
    };
  }

  const attendanceBase = Math.max(attendanceCount, 1);
  const taskBase = Math.max(assignedTaskCount, 1);
  const completedBase = Math.max(completedTaskCount, 1);

  const disciplineRaw =
    5 -
    (absentCount / attendanceBase) * 4 -
    (lateCount / attendanceBase) * 1.5 -
    (autoCheckoutCount / attendanceBase) * 0.75;

  const productivityRaw =
    1 +
    (completedTaskCount / taskBase) * 3 +
    Math.min(approvedOvertimeCount, 4) * 0.25;

  const qualityRaw =
    completedTaskCount === 0
      ? 3
      : 1 + (onTimeCompletedTaskCount / completedBase) * 4;

  const teamworkRaw =
    assignedTaskCount === 0
      ? 3
      : 1 + (collaborativeTaskCount / taskBase) * 4;

  const disciplineScore = roundToNearestIntScore(disciplineRaw);
  const productivityScore = roundToNearestIntScore(productivityRaw);
  const qualityScore = roundToNearestIntScore(qualityRaw);
  const teamworkScore = roundToNearestIntScore(teamworkRaw);
  const totalScore = Number(
    (
      productivityScore * 0.35 +
      qualityScore * 0.2 +
      teamworkScore * 0.1 +
      disciplineScore * 0.35
    ).toFixed(2),
  );

  return {
    period: parsedPeriod.period,
    productivity: productivityScore,
    quality: qualityScore,
    teamwork: teamworkScore,
    discipline: disciplineScore,
    totalScore,
    kpiBreakdown: {
      hasSufficientData,
      attendanceCount,
      presentCount,
      lateCount,
      absentCount,
      autoCheckoutCount,
      approvedSubmissionCount: approvedSubmissions.length,
      assignedTaskCount,
      completedTaskCount,
      overdueTaskCount,
      collaborativeTaskCount,
      approvedOvertimeCount,
      approvedOvertimeMinutes,
      approvedOvertimeAmount,
      productivityScore,
      qualityScore,
      teamworkScore,
      disciplineScore,
    },
  };
}
