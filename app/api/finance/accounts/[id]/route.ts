export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "finance", "update");
  if (forbid) return forbid;
  const scopedTenantId = ensureTenantScope(auth.user);

  const { id } = await context.params;
  const body = await req.json();
  const code = String(body.code || "").trim();
  const name = String(body.name || "").trim();
  const accountCategoryId = String(body.accountCategoryId || "").trim();
  const normalBalance = String(body.normalBalance || "").toUpperCase();
  const tenantId = scopedTenantId ?? body.tenantId ?? null;

  if (!code || !name || !accountCategoryId || !normalBalance) {
    return NextResponse.json({ message: "Kode, nama, kategori, dan saldo normal wajib diisi." }, { status: 400 });
  }

  const existing = await prisma.account.findFirst({
    where: {
      id,
      ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
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
      normalBalance: normalBalance as "DEBIT" | "CREDIT",
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
  const forbid = requirePermission(auth.user, "finance", "delete");
  if (forbid) return forbid;
  const scopedTenantId = ensureTenantScope(auth.user);

  const { id } = await context.params;
  const existing = await prisma.account.findFirst({
    where: {
      id,
      ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
  }

  await prisma.account.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
