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

  const where: Prisma.AccountCategoryWhereInput = {};
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (scope === "options") {
    const data = await prisma.accountCategory.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ data });
  }

  const [data, total] = await Promise.all([
    prisma.accountCategory.findMany({
      where,
      orderBy: { code: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accountCategory.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const body = await req.json();
  if (!body.code || !body.name) return NextResponse.json({ message: "Code and name are required" }, { status: 400 });
  const data = await prisma.accountCategory.create({ data: { code: String(body.code), name: String(body.name) } });
  return NextResponse.json({ data }, { status: 201 });
}
