export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { getApprovedOvertimePayoutSummary } from "@/lib/helper/payroll-overtime";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "payrolls", "get-all");
    if (forbid) return forbid;

    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") || "").trim();
    const month = Number(searchParams.get("month") || 0);
    const year = Number(searchParams.get("year") || 0);

    if (!userId || !month || !year) {
      return NextResponse.json(
        { message: "userId, month, dan year wajib diisi" },
        { status: 400 },
      );
    }

    const summary = await getApprovedOvertimePayoutSummary({
      tenantId: ensureTenantScope(auth.user),
      userId,
      month,
      year,
    });

    return NextResponse.json({
      message: "OK",
      data: summary,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch overtime payroll summary" },
      { status: 500 },
    );
  }
}
