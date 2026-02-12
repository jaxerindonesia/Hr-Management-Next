export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const payroll = await prisma.payroll.findMany({
      orderBy: { createdAt: "desc" },
    });

    const payrollWithUser = await Promise.all(
      payroll.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, name: true },
        });
        return { ...p, user };
      })
    );

    return NextResponse.json({
      message: "Payroll retrieved successfully",
      data: payrollWithUser,
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
        status,
        paidAt,
     } = body;

    if (!userId || !month || !year || !basicSalary || !status) {
        return NextResponse.json(
            { message: "All payroll fields are required fields" },
            { status: 400 }
        );
    }

    const existing = await prisma.payroll.findFirst({
      where: { userId: userId, month: month, year: year },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Payroll already exists for this user" },
        { status: 409 }
      );
    }

    const totalSalary = basicSalary + allowances - deductions;
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
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create payroll" },
      { status: 500 }
    );
  }
}

