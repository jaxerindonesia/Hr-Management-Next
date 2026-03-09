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
    const submissionTypeId = searchParams.get("submissionTypeId") || "";

    const where: any = {};

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status) {
      where.status = status;
    }

    if (submissionTypeId) {
      where.submissionTypeId = submissionTypeId;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true },
          },
          submissionType: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({
      message: "Submissions retrieved successfully",
      data: submissions,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve submissions data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { userId, submissionTypeId, startDate, endDate, reason, status } =
      body;

    if (
      !userId ||
      !status ||
      !submissionTypeId ||
      !startDate ||
      !endDate ||
      !reason
    ) {
      return NextResponse.json(
        { message: "All submission fields are required fields" },
        { status: 400 },
      );
    }

    const existing = await prisma.submission.findFirst({
      where: {
        userId: userId,
        submissionTypeId: submissionTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Submission already exists for this user" },
        { status: 409 },
      );
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        submissionTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status,
      },
    });

    return NextResponse.json(
      {
        message: "Submission successfully created.",
        data: submission,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create submission" },
      { status: 500 },
    );
  }
}
