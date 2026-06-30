export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";

function getMonthKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export async function GET() {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const [accountCount, journalCount, postedJournalCount, draftJournalCount, journals, statusGroup] =
    await Promise.all([
      prisma.account.count(),
      prisma.journal.count(),
      prisma.journal.count({ where: { status: "POSTED" } }),
      prisma.journal.count({ where: { status: "DRAFT" } }),
      prisma.journal.findMany({
        select: {
          date: true,
          status: true,
          details: { select: { debit: true, credit: true } },
        },
      }),
      prisma.journal.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

  const monthlyMap = new Map<string, { debit: number; credit: number }>();
  let totalDebit = 0;
  let totalCredit = 0;

  for (const journal of journals) {
    const monthKey = getMonthKey(journal.date);
    const current = monthlyMap.get(monthKey) ?? { debit: 0, credit: 0 };
    const debit = journal.details.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const credit = journal.details.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    current.debit += debit;
    current.credit += credit;
    totalDebit += debit;
    totalCredit += credit;
    monthlyMap.set(monthKey, current);
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, value]) => ({ month, ...value }));

  return NextResponse.json({
    data: {
      accountCount,
      journalCount,
      postedJournalCount,
      draftJournalCount,
      totalDebit,
      totalCredit,
      monthlyTrend,
      statusBreakdown: statusGroup.map((item) => ({
        status: item.status,
        total: item._count.status,
      })),
    },
  });
}
