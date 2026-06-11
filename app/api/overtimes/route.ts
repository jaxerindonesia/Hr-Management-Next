export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (scopedTenantId) where.tenantId = scopedTenantId;
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    if (!["superadmin", "admin"].includes(normalizedRole)) where.userId = auth.user.id;
    if (status) where.status = status;

    const [overtimes, total] = await Promise.all([
      prisma.overtime.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
          attendance: { select: { id: true, date: true, checkIn: true, checkOut: true } },
        },
      }),
      prisma.overtime.count({ where }),
    ]);

    return NextResponse.json({ message: "Overtimes retrieved successfully", data: overtimes, total });
  } catch {
    return NextResponse.json({ message: "Failed to retrieve overtimes data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);
    const body = await req.json();

    const required = ["userId", "overtimeDate", "startTime", "endTime", "requestedMinutes", "overtimeMinutes", "payMethod", "hourlyRate", "dailyRate", "payoutAmount"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return NextResponse.json({ message: `${key} is required` }, { status: 400 });
      }
    }

    const overtime = await prisma.overtime.create({
      data: {
        tenantId: scopedTenantId,
        userId: body.userId,
        attendanceId: body.attendanceId || null,
        overtimeDate: new Date(body.overtimeDate),
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        overtimeMinutes: Number(body.overtimeMinutes),
        requestedMinutes: Number(body.requestedMinutes),
        description: body.description || null,
        payMethod: String(body.payMethod),
        hourlyRate: Number(body.hourlyRate),
        dailyRate: Number(body.dailyRate),
        payoutAmount: Number(body.payoutAmount),
        status: body.status || "PENDING",
      },
      include: {
        user: { select: { id: true, name: true } },
        attendance: { select: { id: true, date: true, checkIn: true, checkOut: true } },
      },
    });

    return NextResponse.json({ message: "Overtime created", data: overtime }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create overtime" }, { status: 500 });
  }
}
