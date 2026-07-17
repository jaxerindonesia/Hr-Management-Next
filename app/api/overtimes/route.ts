export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";

    const where: Prisma.OvertimeWhereInput = {};
    if (scopedTenantId) where.tenantId = scopedTenantId;
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    if (!["superadmin", "admin"].includes(normalizedRole)) {
      where.OR = [
        { userId: auth.user.id },
        { approvalDecisions: { some: { approverUserId: auth.user.id } } },
      ];
    }
    if (status) where.status = status;
    if (search) {
      const currentAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];

      where.AND = [
        ...currentAnd,
        {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [overtimes, total] = await Promise.all([
      prisma.overtime.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
          attendance: { select: { id: true, date: true, checkIn: true, checkOut: true } },
          approvalDecisions: {
            include: { approverUser: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
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
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdmin = ["superadmin", "admin"].includes(normalizedRole);

    const required = ["userId", "overtimeDate", "startTime", "endTime", "requestedMinutes", "overtimeMinutes", "payMethod", "hourlyRate", "dailyRate", "payoutAmount"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return NextResponse.json({ message: `${key} is required` }, { status: 400 });
      }
    }
    if (!isAdmin && body.userId !== auth.user.id) {
      return NextResponse.json({ message: "Anda hanya bisa mengajukan lembur untuk diri sendiri" }, { status: 403 });
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return NextResponse.json(
        { message: "Format jam lembur tidak valid" },
        { status: 400 },
      );
    }
    if (endTime <= startTime) {
      return NextResponse.json(
        { message: "Jam selesai harus setelah jam mulai" },
        { status: 400 },
      );
    }

    const overtime = await prisma.overtime.create({
      data: {
        tenantId: scopedTenantId,
        userId: body.userId,
        attendanceId: body.attendanceId || null,
        overtimeDate: new Date(body.overtimeDate),
        startTime,
        endTime,
        overtimeMinutes: Number(body.overtimeMinutes),
        requestedMinutes: Number(body.requestedMinutes),
        description: body.description || null,
        payMethod: String(body.payMethod),
        hourlyRate: Number(body.hourlyRate),
        dailyRate: Number(body.dailyRate),
        payoutAmount: Number(body.payoutAmount),
        status: "PENDING",
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
