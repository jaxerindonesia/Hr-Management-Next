export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "list";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const accountCategoryId = searchParams.get("accountCategoryId") || "";
  const tenantId = searchParams.get("tenantId");

  const where: Prisma.AccountWhereInput = tenantId ? { tenantId } : { tenantId: null };

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      {
        accountCategory: {
          name: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (accountCategoryId) where.accountCategoryId = accountCategoryId;

  if (scope === "options") {
    const data = await prisma.account.findMany({
      where,
      include: { accountCategory: true, parent: true },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ data });
  }

  const [data, total] = await Promise.all([
    prisma.account.findMany({
      where,
      include: { accountCategory: true, parent: true },
      orderBy: { code: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.account.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const body = await req.json();
  const data = await prisma.account.create({
    data: {
      code: String(body.code),
      name: String(body.name),
      normalBalance: body.normalBalance,
      isActive: body.isActive ?? true,
      accountCategoryId: String(body.accountCategoryId),
      parentId: body.parentId || null,
      tenantId: body.tenantId || null,
    },
  });
  return NextResponse.json({ data }, { status: 201 });
}
