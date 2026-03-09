export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const period = searchParams.get("period") || "";
    const scoreFilter = searchParams.get("score") || "";

    const where: any = {};

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (period) {
      where.period = period;
    }

    if (scoreFilter) {
      if (scoreFilter === "excellent") where.totalScore = { gte: 4.5 };
      else if (scoreFilter === "good") where.totalScore = { gte: 3.5, lt: 4.5 };
      else if (scoreFilter === "fair") where.totalScore = { gte: 2.5, lt: 3.5 };
      else if (scoreFilter === "poor") where.totalScore = { lt: 2.5 };
    }

    const [performances, total] = await Promise.all([
      prisma.performance.findMany({
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
      prisma.performance.count({ where }),
    ]);

    return NextResponse.json({
      message: "Performance retrieved successfully",
      data: performances,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve performance data" },
      { status: 500 },
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

    if (
      !userId ||
      !period ||
      !productivity ||
      !quality ||
      !teamwork ||
      !discipline ||
      !evaluatedBy
    ) {
      return NextResponse.json(
        { message: "All performance fields are required fields" },
        { status: 400 },
      );
    }

    const existing = await prisma.performance.findFirst({
      where: { userId: userId, period: period },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Performance already exists for this user" },
        { status: 409 },
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
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create performance" },
      { status: 500 },
    );
  }
}
