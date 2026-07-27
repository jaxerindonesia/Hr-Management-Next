export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

const DEFAULT_COMPONENTS = [
  {
    name: "BPJS Kesehatan",
    type: "DEDUCTION",
    inputType: "MANUAL",
    defaultValue: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "BPJS Ketenagakerjaan",
    type: "DEDUCTION",
    inputType: "MANUAL",
    defaultValue: 0,
    isActive: true,
    sortOrder: 2,
  },
];

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "payrolls", "set-config");
    if (forbid) return forbid;
    const scopedTenantId = ensureTenantScope(auth.user);

    const items = await prisma.payrollComponentConfig.findMany({
      where: scopedTenantId ? { tenantId: scopedTenantId } : { tenantId: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      message: "OK",
      data: items.length > 0 ? items : DEFAULT_COMPONENTS,
      isDefault: items.length === 0,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch payroll component config" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "payrolls", "set-config");
    if (forbid) return forbid;
    const scopedTenantId = ensureTenantScope(auth.user);
    const body = await req.json();

    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { message: "Minimal tambahkan 1 komponen payroll" },
        { status: 400 },
      );
    }

    const normalizedItems = items.map((item: Record<string, unknown>, index: number) => {
      const name = String(item.name || "").trim();
      const type = String(item.type || "").toUpperCase();
      const inputType = String(item.inputType || "").toUpperCase();
      const defaultValue = Number(item.defaultValue || 0);
      const isActive = Boolean(item.isActive ?? true);
      const sortOrder = Number(item.sortOrder ?? index + 1);

      if (!name) {
        throw new Error("Nama komponen payroll wajib diisi");
      }
      if (!["EARNING", "DEDUCTION"].includes(type)) {
        throw new Error("Tipe komponen payroll tidak valid");
      }
      if (!["FIXED", "PERCENTAGE", "MANUAL"].includes(inputType)) {
        throw new Error("Jenis input komponen payroll tidak valid");
      }
      if (!Number.isFinite(defaultValue) || defaultValue < 0) {
        throw new Error("Nilai default komponen payroll harus angka >= 0");
      }

      return {
        tenantId: scopedTenantId,
        name,
        type,
        inputType,
        defaultValue,
        isActive,
        sortOrder,
      };
    });

    await prisma.$transaction([
      prisma.payrollComponentConfig.deleteMany({
        where: scopedTenantId ? { tenantId: scopedTenantId } : { tenantId: null },
      }),
      prisma.payrollComponentConfig.createMany({
        data: normalizedItems,
      }),
    ]);

    const saved = await prisma.payrollComponentConfig.findMany({
      where: scopedTenantId ? { tenantId: scopedTenantId } : { tenantId: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      message: "Payroll component config updated",
      data: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update payroll component config",
      },
      { status: 500 },
    );
  }
}
