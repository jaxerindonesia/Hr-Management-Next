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
    const department = await prisma.department.findFirst({
      where: { id: p.id },
    });

    if (!department) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve department" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.name) updateData.name = body.name;

    const department = await prisma.department.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Department successfully updated",
      data: department,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update department" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.department.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Department successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete department" },
      { status: 500 },
    );
  }
}
