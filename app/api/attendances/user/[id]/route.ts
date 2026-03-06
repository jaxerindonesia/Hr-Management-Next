export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const attendances = await prisma.attendance.findMany({
      where: { userId: p.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Attendances retrieved successfully",
      data: attendances,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve attendances data" },
      { status: 500 },
    );
  }
}
