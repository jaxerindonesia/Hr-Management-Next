export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser, tenantWhere } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

export async function GET() {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "finance", "get-all");
  if (forbid) return forbid;
  const scope = tenantWhere(auth.user);
  const data = await prisma.bank.findMany({
    where: scope,
    include: { account: true },
    orderBy: { bankName: "asc" },
  });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "finance", "create");
  if (forbid) return forbid;
  const body = await req.json();
  const scope = tenantWhere(auth.user);
  const accountId = String(body.accountId || "").trim();

  if (!accountId) {
    return NextResponse.json({ message: "Akun bank wajib diisi." }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      ...scope,
    },
    select: { id: true, tenantId: true },
  });

  if (!account) {
    return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
  }

  const data = await prisma.bank.create({
    data: {
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountHolder: body.accountHolder,
      accountId: account.id,
      tenantId: account.tenantId ?? scope.tenantId ?? null,
    },
    include: { account: true },
  });
  return NextResponse.json({ data }, { status: 201 });
}
