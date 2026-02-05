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
    const payroll = await prisma.payroll.findUnique({
      where: { id: p.id },
    });

    if (!payroll) {
      return NextResponse.json(
        { message: "Payroll not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payroll);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve payroll" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.month) updateData.month = body.month;
    if (body.year) updateData.year = body.year;
    if (body.basicSalary) updateData.basicSalary = body.basicSalary;
    if (body.allowances) updateData.allowances = body.allowances;
    if (body.deductions) updateData.deductions = body.deductions;
    if (body.totalSalary) updateData.totalSalary = body.totalSalary;
    if (body.status) updateData.status = body.status;
    if (body.paidAt) updateData.paidAt = new Date(body.paidAt);

    const payroll = await prisma.payroll.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Payroll successfully updated",
      data: payroll,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update payroll" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.payroll.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Payroll successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete payroll" },
      { status: 500 }
    );
  }
}
