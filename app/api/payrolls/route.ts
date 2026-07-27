export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { AUTO_OVERTIME_COMPONENT_NAME } from "@/lib/constants/payroll";
import {
  getApprovedOvertimePayoutSummary,
} from "@/lib/helper/payroll-overtime";

function buildPayrollReferenceNumber(id: string, createdAt: Date) {
  return `PYR-${createdAt.getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
}

function normalizeComponentValues(items: unknown[], basicSalary: number) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const row = item as Record<string, unknown>;
    const inputTypeSnapshot = String(row.inputTypeSnapshot || row.inputType || "MANUAL").toUpperCase();
    const baseValue =
      inputTypeSnapshot === "PERCENTAGE"
        ? Number(row.baseValue ?? row.amount ?? 0)
        : null;
    const amount =
      inputTypeSnapshot === "PERCENTAGE"
        ? (basicSalary * Number(row.baseValue ?? row.amount ?? 0)) / 100
        : Number(row.amount || 0);

    return {
      componentConfigId: row.componentConfigId ? String(row.componentConfigId) : null,
      nameSnapshot: String(row.nameSnapshot || row.name || "").trim(),
      typeSnapshot: String(row.typeSnapshot || row.type || "").toUpperCase(),
      inputTypeSnapshot,
      amount: Number.isFinite(amount) ? amount : 0,
      baseValue: baseValue !== null && Number.isFinite(baseValue) ? baseValue : null,
    };
  }).filter((item) =>
    item.nameSnapshot &&
    item.nameSnapshot !== AUTO_OVERTIME_COMPONENT_NAME &&
    ["EARNING", "DEDUCTION"].includes(item.typeSnapshot),
  );
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "payrolls", "get-all");
    if (forbid) return forbid;

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
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { referenceNumber: { contains: search, mode: "insensitive" } },
      ];
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
    const forbid = requirePermission(auth.user, "payrolls", "create");
    if (forbid) return forbid;

    const body = await req.json();

    const {
      userId,
      month,
      year,
      basicSalary,
      status,
      paidAt,
      componentValues,
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

    const normalizedBasicSalary = Number(basicSalary || 0);
    const normalizedComponentValues = normalizeComponentValues(componentValues, normalizedBasicSalary);
    const overtimeSummary = await getApprovedOvertimePayoutSummary({
      tenantId: finalTenantId,
      userId,
      month: Number(month),
      year: Number(year),
    });
    if (overtimeSummary.totalAmount > 0) {
      normalizedComponentValues.push({
        componentConfigId: null,
        nameSnapshot: AUTO_OVERTIME_COMPONENT_NAME,
        typeSnapshot: "EARNING",
        inputTypeSnapshot: "FIXED",
        amount: overtimeSummary.totalAmount,
        baseValue: null,
      });
    }
    const allowances = normalizedComponentValues
      .filter((item) => item.typeSnapshot === "EARNING")
      .reduce((sum, item) => sum + item.amount, 0);
    const deductions = normalizedComponentValues
      .filter((item) => item.typeSnapshot === "DEDUCTION")
      .reduce((sum, item) => sum + item.amount, 0);
    const totalSalary = normalizedBasicSalary + allowances - deductions;
    const payroll = await prisma.payroll.create({
      data: {
        tenantId: finalTenantId,
        userId,
        month,
        year,
        basicSalary: normalizedBasicSalary,
        allowances,
        deductions,
        totalSalary,
        status,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
    });
    const referenceNumber = buildPayrollReferenceNumber(
      payroll.id,
      payroll.createdAt,
    );
    const payrollWithReference = await prisma.payroll.update({
      where: { id: payroll.id },
      data: { referenceNumber },
    });

    if (normalizedComponentValues.length > 0) {
      await prisma.payrollComponentValue.createMany({
        data: normalizedComponentValues.map((item) => ({
          payrollId: payroll.id,
          componentConfigId: item.componentConfigId,
          nameSnapshot: item.nameSnapshot,
          typeSnapshot: item.typeSnapshot,
          inputTypeSnapshot: item.inputTypeSnapshot,
          amount: item.amount,
          baseValue: item.baseValue,
        })),
      });
    }

    return NextResponse.json(
      {
        message: "Payroll successfully created.",
        data: {
          ...payrollWithReference,
          componentValues: normalizedComponentValues,
        },
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
