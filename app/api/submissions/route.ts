export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Submissions retrieved successfully",
      data: submissions,
    });
  } catch (error) {
    console.error("GET SUBMISSIONS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve submissions data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { 
      userId,
      submissionTypeId,
      startDate,
      endDate,
      reason,
      status,
     } = body;

    if (!userId || !status || !submissionTypeId || !startDate || !endDate || !reason) {
        return NextResponse.json(
            { message: "All submission fields are required fields" },
            { status: 400 }
        );
    }

    const existing = await prisma.submission.findFirst({
      where: { userId: userId, submissionTypeId: submissionTypeId, startDate: new Date(startDate), endDate: new Date(endDate) },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Submission already exists for this user" },
        { status: 409 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SUBMISSION ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create submission" },
      { status: 500 }
    );
  }
}

