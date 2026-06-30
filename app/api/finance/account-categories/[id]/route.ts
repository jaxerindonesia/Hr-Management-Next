export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser, ensureTenantScope } from "@/lib/auth/tenant";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await req.json();
  const tenantId = ensureTenantScope(auth.user);

  if (!body.code || !body.name) {
    return NextResponse.json({ message: "Code and name are required" }, { status: 400 });
  }

  const existing = await prisma.accountCategory.findFirst({
    where: {
      id,
      ...(tenantId ? { tenantId } : {}),
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Kategori akun tidak ditemukan" }, { status: 404 });
  }

  const code = String(body.code).trim();
  const name = String(body.name).trim();

  const duplicate = await prisma.accountCategory.findFirst({
    where: {
      tenantId,
      code,
      NOT: { id },
    },
  });

  if (duplicate) {
    return NextResponse.json({ message: "Kode kategori akun sudah digunakan." }, { status: 409 });
  }

  const data = await prisma.accountCategory.update({
    where: { id },
    data: {
      code,
      name,
    },
  });

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const tenantId = ensureTenantScope(auth.user);
  const existing = await prisma.accountCategory.findFirst({
    where: {
      id,
      ...(tenantId ? { tenantId } : {}),
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Kategori akun tidak ditemukan" }, { status: 404 });
  }

  await prisma.accountCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
