export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await req.json();
  const code = String(body.code || "").trim();
  const name = String(body.name || "").trim();
  const accountCategoryId = String(body.accountCategoryId || "").trim();
  const normalBalance = String(body.normalBalance || "").toUpperCase();
  const tenantId = auth.user.tenantId ?? body.tenantId ?? null;

  if (!code || !name || !accountCategoryId || !normalBalance) {
    return NextResponse.json({ message: "Kode, nama, kategori, dan saldo normal wajib diisi." }, { status: 400 });
  }

  const duplicate = await prisma.account.findFirst({
    where: {
      code,
      tenantId,
      NOT: { id },
    },
  });

  if (duplicate) {
    return NextResponse.json({ message: "Kode akun sudah digunakan." }, { status: 409 });
  }

  const data = await prisma.account.update({
    where: { id },
    data: {
      code,
      name,
      normalBalance,
      isActive: body.isActive ?? true,
      accountCategoryId,
      parentId: body.parentId || null,
      tenantId,
    },
    include: { accountCategory: true, parent: true },
  });

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  await prisma.account.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
