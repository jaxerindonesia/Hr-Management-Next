export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const where: any = {};

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      message: "Attendances retrieved successfully",
      data: attendances,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve attendances data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { userId, date, checkIn, checkOut, status, notes } = body;

    if (!userId || !date || !checkIn || !checkOut || !status) {
      return NextResponse.json(
        { message: "All attendance fields are required fields" },
        { status: 400 },
      );
    }

    const existing = await prisma.attendance.findFirst({
      where: { userId: userId, date: new Date(date) },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Attendance already exists for this user" },
        { status: 409 },
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: new Date(date),
        checkIn,
        checkOut,
        status,
        notes,
      },
    });

    return NextResponse.json(
      {
        message: "Attendance successfully created.",
        data: attendance,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create attendance" },
      { status: 500 },
    );
  }
}
