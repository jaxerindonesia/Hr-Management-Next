export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const attendances = await prisma.attendance.findMany({
      where: { userId: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Attendances retrieved successfully",
      data: attendances,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve attendances data" },
      { status: 500 },
    );
  }
}
