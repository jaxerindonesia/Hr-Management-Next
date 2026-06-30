export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser, tenantWhere } from "@/lib/auth/tenant";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await req.json();
  const scope = tenantWhere(auth.user);
  const code = String(body.code || "").trim();
  const name = String(body.name || "").trim();
  const email = body.email ? String(body.email).trim().toLowerCase() : "";

  if (!code) {
    return NextResponse.json({ message: "Code wajib diisi" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ message: "Name wajib diisi" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ message: "Email wajib diisi" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Email harus berupa alamat email yang valid" }, { status: 400 });
  }

  const duplicateCode = await prisma.customer.findFirst({
    where: { ...scope, code, NOT: { id } },
  });
  if (duplicateCode) {
    return NextResponse.json({ message: "Code sudah digunakan" }, { status: 409 });
  }

  if (email) {
    const duplicateEmail = await prisma.customer.findFirst({
      where: { ...scope, email: { equals: email, mode: "insensitive" }, NOT: { id } },
    });
    if (duplicateEmail) {
      return NextResponse.json({ message: "Email sudah digunakan" }, { status: 409 });
    }
  }

  const data = await prisma.customer.update({
    where: { id },
    data: {
      code,
      name,
      phone: body.phone || null,
      email,
      address: body.address || null,
      tenantId: scope.tenantId ?? null,
    },
  });

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  await prisma.customer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
