export const runtime = "nodejs";

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const payroll = await prisma.payroll.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
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
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.payroll.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Payroll not found" }, { status: 404 });

    const body = await req.json();

    const updateData: any = {};

    const totalSalary = body.basicSalary + body.allowances - body.deductions;
    updateData.totalSalary = totalSalary;

    if (body.month) updateData.month = body.month;
    if (body.year) updateData.year = body.year;
    if (body.basicSalary) updateData.basicSalary = body.basicSalary;
    if (body.allowances) updateData.allowances = body.allowances;
    if (body.deductions) updateData.deductions = body.deductions;
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
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.payroll.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Payroll not found" }, { status: 404 });

    await prisma.payroll.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Payroll successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return NextResponse.json(
      { message: "Failed to delete payroll" },
      { status: 500 }
    );
  }
}
