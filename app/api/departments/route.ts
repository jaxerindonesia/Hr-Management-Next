export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Departments retrieved successfully",
      data: departments,
    });
  } catch (error) {
    console.error("GET DEPARTMENTS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve departments data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.department.findFirst({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Department already exists" },
        { status: 409 },
      );
    }

    const department = await prisma.department.create({
      data: { name },
    });

    return NextResponse.json(
      {
        message: "Department successfully created.",
        data: department,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE DEPARTMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create department" },
      { status: 500 },
    );
  }
}
