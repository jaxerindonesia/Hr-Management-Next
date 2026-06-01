export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

const DEFAULT_CONFIG = {
  overtimeHourlyRate: 100000,
  minimumOvertimeMinutes: 60,
  autoCheckoutTime: "23:59",
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

    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    if (!(normalizedRole === "admin" || normalizedRole === "superadmin")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const body = await req.json();

    const overtimeHourlyRate = Number(body.overtimeHourlyRate);
    const minimumOvertimeMinutes = Number(body.minimumOvertimeMinutes);
    const autoCheckoutTime = String(body.autoCheckoutTime || "").trim();

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!Number.isFinite(overtimeHourlyRate) || overtimeHourlyRate <= 0) {
      return NextResponse.json({ message: "Rate lembur harus > 0" }, { status: 400 });
    }
    if (!Number.isFinite(minimumOvertimeMinutes) || minimumOvertimeMinutes < 0) {
      return NextResponse.json({ message: "Minimum menit lembur harus >= 0" }, { status: 400 });
    }
    if (!timeRegex.test(autoCheckoutTime)) {
      return NextResponse.json({ message: "Format auto checkout harus HH:mm" }, { status: 400 });
    }

    const existing = await prisma.overtimeConfig.findFirst({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { updatedAt: "desc" },
    });

    const data = { overtimeHourlyRate, minimumOvertimeMinutes, autoCheckoutTime };

    const saved = existing
      ? await prisma.overtimeConfig.update({ where: { id: existing.id }, data })
      : await prisma.overtimeConfig.create({
          data: {
            ...data,
            ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
          },
        });

    return NextResponse.json({ message: "Overtime config updated", data: saved });
  } catch {
    return NextResponse.json({ message: "Failed to update overtime config" }, { status: 500 });
  }
}
