export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

export async function GET() {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "finance", "get-all");
  if (forbid) return forbid;
  const data = await prisma.bank.findMany({ include: { account: true }, orderBy: { bankName: "asc" } });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "finance", "create");
  if (forbid) return forbid;
  const body = await req.json();
  const data = await prisma.bank.create({ data: body });
  return NextResponse.json({ data }, { status: 201 });
}
