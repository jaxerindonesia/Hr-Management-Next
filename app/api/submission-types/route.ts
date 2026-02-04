export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const submissionTypes = await prisma.submissionType.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Submission types retrieved successfully",
      data: submissionTypes,
    });
  } catch (error) {
    console.error("GET SUBMISSION TYPES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve submission types data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name } = body;

    if (!name) {
        return NextResponse.json(
            { message: "Submission type name is required" },
            { status: 400 }
        );
    }

    const existing = await prisma.submissionType.findFirst({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Submission type already exists" },
        { status: 409 }
      );
    }

    const submissionType = await prisma.submissionType.create({
      data: { name },
    });

    return NextResponse.json(
      {
        message: "Submission type successfully created.",
        data: submissionType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SUBMISSION TYPE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create submission type" },
      { status: 500 }
    );
  }
}

