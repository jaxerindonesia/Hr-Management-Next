export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";

type Context = {
  params: Promise<{ id: string }>;
};

function calcTotals(details: Array<{ debit?: number; credit?: number }>) {
  return details.reduce<{ debit: number; credit: number }>(
    (acc, item) => ({
      debit: acc.debit + Number(item.debit || 0),
      credit: acc.credit + Number(item.credit || 0),
    }),
    { debit: 0, credit: 0 },
  );
}

export async function GET(_req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const data = await prisma.journal.findUnique({
    where: { id },
    include: {
      details: { include: { account: true, customer: true, vendor: true } },
      creator: true,
    },
  });

  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await req.json();
  const journalNo = String(body.journalNo || "").trim();
  const details = Array.isArray(body.details) ? body.details : [];
  const totals = calcTotals(details);

  if (!journalNo) {
    return NextResponse.json({ message: "No jurnal wajib diisi." }, { status: 400 });
  }

  const duplicate = await prisma.journal.findFirst({
    where: { journalNo, NOT: { id } },
  });
  if (duplicate) {
    return NextResponse.json({ message: "No jurnal sudah digunakan." }, { status: 409 });
  }

  if (totals.debit !== totals.credit) {
    return NextResponse.json({ message: "Total debit dan credit harus sama." }, { status: 400 });
  }

  await prisma.journalDetail.deleteMany({ where: { journalId: id } });

  const data = await prisma.journal.update({
    where: { id },
    data: {
      journalNo,
      date: new Date(body.date),
      referenceNo: body.referenceNo || null,
      description: body.description || null,
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

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  await prisma.journal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
