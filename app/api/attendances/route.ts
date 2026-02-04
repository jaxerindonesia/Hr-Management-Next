export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const attendances = await prisma.attendance.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Attendances retrieved successfully",
      data: attendances,
    });
  } catch (error) {
    console.error("GET ATTENDANCES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve attendances data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { 
      userId,
      date,
      checkIn,
      checkOut,
      status,
      notes,
     } = body;

    if (!userId || !date || !checkIn || !checkOut || !status) {
        return NextResponse.json(
            { message: "All attendance fields are required fields" },
            { status: 400 }
        );
    }

    const existing = await prisma.attendance.findFirst({
      where: { userId: userId, date: new Date(date) },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Attendance already exists for this user" },
        { status: 409 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ATTENDANCE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create attendance" },
      { status: 500 }
    );
  }
}

