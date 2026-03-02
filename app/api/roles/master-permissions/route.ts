export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { MASTER_PERMISSIONS } from "@/lib/master-permission";

export async function GET() {
  try {
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
