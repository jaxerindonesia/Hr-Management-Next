export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
  const search = searchParams.get("search") || "";
  const accountId = searchParams.get("accountId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const details = await prisma.journalDetail.findMany({
    where: {
      ...(accountId ? { accountId } : {}),
      ...(search
        ? {
            OR: [
              { journal: { journalNo: { contains: search, mode: "insensitive" } } },
              { journal: { description: { contains: search, mode: "insensitive" } } },
              { description: { contains: search, mode: "insensitive" } },
              { account: { code: { contains: search, mode: "insensitive" } } },
              { account: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
      journal: {
        status: "POSTED",
        ...(from || to
          ? {
              ...(from ? { date: { gte: new Date(from) } } : {}),
              ...(to ? { date: { lte: new Date(to) } } : {}),
            }
          : {}),
      },
    },
    include: { journal: true, account: true },
    orderBy: [{ journal: { date: "asc" } }, { journal: { journalNo: "asc" } }],
  });

  const rows = details.map((detail) => {
    const signedBalance = Number(detail.debit || 0) - Number(detail.credit || 0);
    return {
      accountId: detail.accountId,
      accountCode: detail.account.code,
      accountName: detail.account.name,
      normalBalance: detail.account.normalBalance,
      journalNo: detail.journal.journalNo,
      journalDate: detail.journal.date.toISOString(),
      referenceNo: detail.journal.referenceNo,
      description: detail.journal.description,
      detailDescription: detail.description,
      debit: Number(detail.debit || 0),
      credit: Number(detail.credit || 0),
      balance: signedBalance,
    };
  });

  const total = rows.length;
  const data = rows.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data, total, page, limit });
}
