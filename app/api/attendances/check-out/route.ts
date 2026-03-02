export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, checkOutLocation } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "UserId is required" },
        { status: 400 },
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "You have not checked in today" },
        { status: 404 },
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { message: "Already checked out today" },
        { status: 409 },
      );
    }

    const now = new Date();

    // hitung jam kerja
    const checkInTime = new Date(attendance.checkIn!);
    const diffMs = now.getTime() - checkInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const formattedWorkHours = `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}`;

    let status = attendance.status;

    if (diffHours < 5) {
      status = "Half Day";
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now.toISOString(),
        status,
        workHours: formattedWorkHours,
        checkOutLocation,
      },
    });

    return NextResponse.json({
      message: "Check Out successful",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to check out" },
      { status: 500 },
    );
  }
}
