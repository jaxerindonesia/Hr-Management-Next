export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: p.id },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Attendance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve attendance" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.userId) updateData.userId = body.userId;
    if (body.date) updateData.date = new Date(body.date);
    if (body.checkIn) updateData.checkIn = body.checkIn;
    if (body.checkOut) updateData.checkOut = body.checkOut;
    if (body.status) updateData.status = body.status;
    if (body.notes) updateData.notes = body.notes;

    const attendance = await prisma.attendance.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Attendance successfully updated",
      data: attendance,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update attendance" },
      { status: 500 }
    );
  }
}


export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.attendance.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Attendance successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
