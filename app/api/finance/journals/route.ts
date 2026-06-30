export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";

function calcTotals(details: Array<{ debit?: number; credit?: number }>) {
  return details.reduce<{ debit: number; credit: number }>(
    (acc, item) => ({
      debit: acc.debit + Number(item.debit || 0),
      credit: acc.credit + Number(item.credit || 0),
    }),
    { debit: 0, credit: 0 },
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Prisma.JournalWhereInput = {};

  if (search) {
    where.OR = [
      { journalNo: { contains: search, mode: "insensitive" } },
      { referenceNo: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "all") {
    const normalizedStatus = status.toUpperCase();
    if (
      normalizedStatus === "DRAFT" ||
      normalizedStatus === "POSTED" ||
      normalizedStatus === "VOID"
    ) {
      where.status = normalizedStatus;
    }
  }

  const [data, total] = await Promise.all([
    prisma.journal.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        details: { include: { account: true, customer: true, vendor: true } },
        creator: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.journal.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const body = await req.json();
  const journalNo = String(body.journalNo || "").trim();
  const details = Array.isArray(body.details) ? body.details : [];
  const totals = calcTotals(details);

  if (!journalNo) {
    return NextResponse.json({ message: "No jurnal wajib diisi." }, { status: 400 });
  }

  const duplicate = await prisma.journal.findUnique({ where: { journalNo } });
  if (duplicate) {
    return NextResponse.json({ message: "No jurnal sudah digunakan." }, { status: 409 });
  }

  if (totals.debit !== totals.credit) {
    return NextResponse.json({ message: "Total debit dan credit harus sama." }, { status: 400 });
  }
  const data = await prisma.journal.create({
    data: {
      journalNo,
      date: new Date(body.date),
      referenceNo: body.referenceNo || null,
      description: body.description || null,
      createdBy: auth.user.id,
      status: body.status || "DRAFT",
      details: {
        create: details.map((item: { accountId: string; debit?: number; credit?: number; description?: string; customerId?: string; vendorId?: string }) => ({
          accountId: item.accountId,
          debit: Number(item.debit || 0),
          credit: Number(item.credit || 0),
          description: item.description || null,
          customerId: item.customerId || null,
          vendorId: item.vendorId || null,
        })),
      },
    },
    include: { details: true },
  });
  return NextResponse.json({ data }, { status: 201 });
}
