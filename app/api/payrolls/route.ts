export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const status = searchParams.get("status") || "";

    const where: Prisma.PayrollWhereInput = {};
    const scopedTenantId = ensureTenantScope(auth.user);
    if (scopedTenantId) where.tenantId = scopedTenantId;

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return NextResponse.json({
      message: "Payroll retrieved successfully",
      data: payrolls,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve payroll data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

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
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const existing = await prisma.payroll.findFirst({
      where: { userId: userId, month: month, year: year, ...(finalTenantId ? { tenantId: finalTenantId } : {}) },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Payroll already exists for this user" },
        { status: 409 },
      );
    }

    const totalSalary = basicSalary + allowances - deductions;
    const payroll = await prisma.payroll.create({
      data: {
        tenantId: finalTenantId,
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
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create payroll" },
      { status: 500 },
    );
  }
}
