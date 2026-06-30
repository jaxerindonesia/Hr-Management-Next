export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSessionUser, tenantWhere } from "@/lib/auth/tenant";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const search = (searchParams.get("search") || "").trim();

  const where: Prisma.VendorWhereInput = {};
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { code: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
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

  const [duplicateCode, duplicateEmail] = await Promise.all([
    prisma.vendor.findFirst({ where: { ...scope, code } }),
    email ? prisma.vendor.findFirst({ where: { ...scope, email: { equals: email, mode: "insensitive" } } }) : null,
  ]);

  if (duplicateCode) {
    return NextResponse.json({ message: "Code sudah digunakan" }, { status: 409 });
  }
  if (duplicateEmail) {
    return NextResponse.json({ message: "Email sudah digunakan" }, { status: 409 });
  }

  const data = await prisma.vendor.create({
    data: {
      code,
      name,
      phone: body.phone || null,
      email,
      address: body.address || null,
      tenantId: scope.tenantId ?? null,
    },
  });
  return NextResponse.json({ data }, { status: 201 });
}
