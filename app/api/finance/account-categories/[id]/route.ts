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

  if (!body.code || !body.name) {
    return NextResponse.json({ message: "Code and name are required" }, { status: 400 });
  }

  const data = await prisma.accountCategory.update({
    where: { id },
    data: {
      code: String(body.code),
      name: String(body.name),
    },
  });

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  await prisma.accountCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
