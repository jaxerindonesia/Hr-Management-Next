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
    const submissionType = await prisma.submissionType.findFirst({
      where: { id: p.id },
    });

    if (!submissionType) {
      return NextResponse.json(
        { message: "Submission type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submissionType);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve submission type" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.name) updateData.name = body.name;

    const submissionType = await prisma.submissionType.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Submission type successfully updated",
      data: submissionType,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update submission type" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.submissionType.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Submission type successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete submission type" },
      { status: 500 }
    );
  }
}
