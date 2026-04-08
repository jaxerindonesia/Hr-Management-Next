export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

// GET - semua konfigurasi batas cuti
export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const configs = await prisma.leaveConfig.findMany({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        submissionTypes: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ message: "OK", data: configs });
  } catch (error) {
    console.error("GET LEAVE CONFIGS ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil konfigurasi cuti" }, { status: 500 });
  }
}

// POST - buat konfigurasi baru
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { name, maxDays, description, submissionTypeIds } = body;

    if (!name || !maxDays) {
      return NextResponse.json({ message: "Nama dan maksimal hari wajib diisi" }, { status: 400 });
    }

    if (isNaN(Number(maxDays)) || Number(maxDays) <= 0) {
      return NextResponse.json({ message: "Maksimal hari harus berupa angka positif" }, { status: 400 });
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const config = await prisma.leaveConfig.create({
      data: {
        name,
        maxDays: Number(maxDays),
        description: description || null,
        tenantId: finalTenantId,
        // Hubungkan submission types yang dipilih
        submissionTypes: submissionTypeIds?.length
          ? { connect: submissionTypeIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        submissionTypes: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Konfigurasi berhasil dibuat", data: config }, { status: 201 });
  } catch (error) {
    console.error("POST LEAVE CONFIG ERROR:", error);
    return NextResponse.json({ message: "Gagal membuat konfigurasi cuti" }, { status: 500 });
  }
}
