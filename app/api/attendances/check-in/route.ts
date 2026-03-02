export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, checkInLocation } = body;

    const now = new Date();

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: now,
        checkIn: now,
        status: "Present",
        workHours: "0",
        checkInLocation,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve attendances data" },
      { status: 500 },
    );
  }
}
