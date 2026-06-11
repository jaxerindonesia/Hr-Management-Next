export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

const DEFAULT_CONFIG = {
  payMethod: "PER_HOUR",
  hourlyRate: 0,
  dailyRate: 0,
  overtimeBuffer: 60,
};

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const cfg = await prisma.overtimeConfig.findFirst({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ message: "OK", data: cfg ?? DEFAULT_CONFIG, isDefault: !cfg });
  } catch {
    return NextResponse.json({ message: "Failed to fetch overtime config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);
    const body = await req.json();

    const payMethod = String(body.payMethod || "").toUpperCase();
    const hourlyRate = Number(body.hourlyRate);
    const dailyRate = Number(body.dailyRate);
    const overtimeBuffer = Number(body.overtimeBuffer);

    if (!["PER_HOUR", "PER_DAY"].includes(payMethod)) {
      return NextResponse.json({ message: "Metode pembayaran lembur tidak valid" }, { status: 400 });
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || !Number.isFinite(dailyRate) || dailyRate < 0) {
      return NextResponse.json({ message: "Nominal lembur harus angka >= 0" }, { status: 400 });
    }
    if (!Number.isFinite(overtimeBuffer) || overtimeBuffer < 0) {
      return NextResponse.json({ message: "Buffer lembur harus angka >= 0" }, { status: 400 });
    }

    const existing = await prisma.overtimeConfig.findFirst({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { updatedAt: "desc" },
    });

    const data = { payMethod, hourlyRate, dailyRate, overtimeBuffer };
    if (payMethod === "PER_HOUR") data.dailyRate = 0;
    if (payMethod === "PER_DAY") data.hourlyRate = 0;
    if (payMethod === "PER_DAY") data.overtimeBuffer = 0;
    const saved = existing
      ? await prisma.overtimeConfig.update({ where: { id: existing.id }, data })
      : await prisma.overtimeConfig.create({ data: { ...data, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) } });

    return NextResponse.json({ message: "Overtime config updated", data: saved });
  } catch {
    return NextResponse.json({ message: "Failed to update overtime config" }, { status: 500 });
  }
}
