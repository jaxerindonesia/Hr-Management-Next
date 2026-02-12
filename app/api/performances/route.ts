export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const performance = await prisma.performance.findMany({
      orderBy: { createdAt: "desc" },
    });

    const performanceWithUser = await Promise.all(
      performance.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, name: true },
        });
        return { ...p, user };
      })
    );

    return NextResponse.json({
      message: "Performance retrieved successfully",
      data: performanceWithUser,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve performance data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userId,
      period,
      productivity,
      quality,
      teamwork,
      discipline,
      notes,
      evaluatedBy,
    } = body;

    if (!userId || !period || !productivity || !quality || !teamwork || !discipline || !evaluatedBy) {
        return NextResponse.json(
            { message: "All performance fields are required fields" },
            { status: 400 }
        );
    }

    const existing = await prisma.performance.findFirst({
      where: { userId: userId, period: period },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Performance already exists for this user" },
        { status: 409 }
      );
    }

   const totalScore =
      (Number(productivity) +
        Number(quality) +
        Number(teamwork) +
        Number(discipline)) /
      4;

    const performance = await prisma.performance.create({
      data: {
        userId,
        period,
        productivity: Number(productivity),
        quality: Number(quality),
        teamwork: Number(teamwork),
        discipline: Number(discipline),
        totalScore,
        notes,
        evaluatedBy,
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Performance successfully created.",
        data: performance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create performance" },
      { status: 500 }
    );
  }
}

