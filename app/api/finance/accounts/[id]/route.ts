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

  const data = await prisma.account.update({
    where: { id },
    data: {
      code: String(body.code),
      name: String(body.name),
      normalBalance: body.normalBalance,
      isActive: body.isActive ?? true,
      accountCategoryId: String(body.accountCategoryId),
      parentId: body.parentId || null,
      tenantId: body.tenantId || null,
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
