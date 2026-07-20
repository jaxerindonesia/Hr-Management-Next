export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission";
import { requireSessionUser } from "@/lib/auth/tenant";
import { MASTER_PERMISSIONS } from "@/lib/master-permission";

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "roles", "get-all");
    if (forbid) return forbid;

    return NextResponse.json({
      message: "Master permissions retrieved successfully",
      data: MASTER_PERMISSIONS,
    });
  } catch (error) {
    console.error("GET MASTER PERMISSIONS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve master permissions" },
      { status: 500 }
    );
  }
}
