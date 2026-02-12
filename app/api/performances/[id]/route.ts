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
    const performance = await prisma.performance.findUnique({
      where: { id: p.id },
    });

    if (!performance) {
      return NextResponse.json(
        { message: "Performance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(performance);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve performance" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;

  try {
    const body = await req.json();
    const existing = await prisma.performance.findUnique({
      where: { id: p.id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Performance not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.period) updateData.period = body.period;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.evaluatedBy) updateData.evaluatedBy = body.evaluatedBy;

    // Handle score updates
    const productivity =
      body.productivity !== undefined
        ? Number(body.productivity)
        : existing.productivity;

    const quality =
      body.quality !== undefined
        ? Number(body.quality)
        : existing.quality;

    const teamwork =
      body.teamwork !== undefined
        ? Number(body.teamwork)
        : existing.teamwork;

    const discipline =
      body.discipline !== undefined
        ? Number(body.discipline)
        : existing.discipline;

    if (
      body.productivity !== undefined ||
      body.quality !== undefined ||
      body.teamwork !== undefined ||
      body.discipline !== undefined
    ) {
      updateData.productivity = productivity;
      updateData.quality = quality;
      updateData.teamwork = teamwork;
      updateData.discipline = discipline;

      updateData.totalScore =
        (productivity + quality + teamwork + discipline) / 4;
    }

    updateData.evaluatedAt = new Date();

    const performance = await prisma.performance.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Performance successfully updated",
      data: performance,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update performance" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.performance.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Performance successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting performance:", error);
    return NextResponse.json(
      { message: "Failed to delete performance" },
      { status: 500 }
    );
  }
}
