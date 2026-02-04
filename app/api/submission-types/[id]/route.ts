export const runtime = "nodejs";

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  try {
    const submissionType = await prisma.submissionType.findFirst({
      where: { id: params.id },
    });

    if (!submissionType) {
      return NextResponse.json(
        { message: "Submission type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submissionType);
  } catch (error) {
    console.error("GET SUBMISSION TYPE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to retrieve submission type" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.name) updateData.name = body.name;

    const submissionType = await prisma.submissionType.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Submission type successfully updated",
      data: submissionType,
    });
  } catch (error) {
    console.error("UPDATE SUBMISSION TYPE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to update submission type" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await prisma.submissionType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Submission type successfully deleted",
    });
  } catch (error) {
    console.error("DELETE SUBMISSION TYPE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to delete submission type" },
      { status: 500 }
    );
  }
}
