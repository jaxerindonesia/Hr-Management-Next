export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { buildPerformanceKpi } from "@/lib/helper/performance-kpi";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const canCreate = !requirePermission(auth.user, "performances", "create");
    const canUpdate = !requirePermission(auth.user, "performances", "update");
    if (!canCreate && !canUpdate) {
      return requirePermission(auth.user, "performances", "create");
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const period = searchParams.get("period") || "";

    if (!userId || !period) {
      return NextResponse.json(
        { message: "User dan periode wajib diisi" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const data = await buildPerformanceKpi({
      tenantId: scopedTenantId,
      userId,
      period,
    });

    return NextResponse.json({
      message: "Performance KPI preview retrieved successfully",
      data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to retrieve KPI preview" },
      { status: 500 },
    );
  }
}
