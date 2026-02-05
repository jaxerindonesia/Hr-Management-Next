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
    const submission = await prisma.submission.findFirst({
      where: { id: p.id },
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve submission" },
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
    if (body.submissionTypeId) updateData.submissionTypeId = body.submissionTypeId;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.reason) updateData.reason = body.reason;
    if (body.status) updateData.status = body.status;

    const submission = await prisma.submission.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Submission successfully updated",
      data: submission,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.submission.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Submission successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
