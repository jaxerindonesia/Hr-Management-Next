export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { hasPermission } from "@/lib/auth/permission";

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const canReadOptions =
    hasPermission(auth.user, "work-shifts", "get-all") ||
    hasPermission(auth.user, "shift-schedules", "get-all") ||
    hasPermission(auth.user, "shift-schedules", "update");
  if (!canReadOptions) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const scopedTenantId = ensureTenantScope(auth.user);
  const includeShifts = req.nextUrl.searchParams.get("includeShifts") === "true";
  const branches = await prisma.branch.findMany({
    where: { scheduleType: "SHIFT", isActive: true, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, tenantId: true, name: true, code: true, scheduleType: true, isActive: true },
  });

  if (!includeShifts) return NextResponse.json({ data: branches });

  const shifts = await prisma.workShift.findMany({
    where: {
      isActive: true,
      branch: { scheduleType: "SHIFT", isActive: true },
      ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
    },
    orderBy: [{ branch: { name: "asc" } }, { startTime: "asc" }],
    select: {
      id: true,
      branchId: true,
      name: true,
      startTime: true,
      endTime: true,
      isActive: true,
    },
  });
  return NextResponse.json({ data: branches, shifts });
}
