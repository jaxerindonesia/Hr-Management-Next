export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function isAuthorizedCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Allow local/manual call when secret is not configured
  if (!cronSecret) return true;

  const authHeader = req.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const result = await prisma.tenant.updateMany({
      where: {
        isActive: true,
        subscriptionEnd: {
          lt: startOfToday,
        },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Tenant expiry check completed",
      updated: result.count,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("CRON TENANT EXPIRY ERROR:", error);
    return NextResponse.json(
      { message: "Failed to run tenant expiry job" },
      { status: 500 },
    );
  }
}
