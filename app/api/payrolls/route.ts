export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const payroll = await prisma.payroll.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Payroll retrieved successfully",
      data: payroll,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve payroll data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { 
        userId,
        month,
        year,
        basicSalary,
        allowances,
        deductions,
        totalSalary,
        status,
        paidAt,
     } = body;

    if (!userId || !month || !year || !basicSalary || !allowances || !deductions || !totalSalary || !status) {
        return NextResponse.json(
            { message: "All payroll fields are required fields" },
            { status: 400 }
        );
    }

    const existing = await prisma.payroll.findFirst({
      where: { userId: userId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Payroll already exists for this user" },
        { status: 409 }
      );
    }
    const payroll = await prisma.payroll.create({
      data: {
        userId,
        month,
        year,
        basicSalary,
        allowances,
        deductions,
        totalSalary,
        status,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
    });

    return NextResponse.json(
      {
        message: "Payroll successfully created.",
        data: payroll,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create payroll" },
      { status: 500 }
    );
  }
}

