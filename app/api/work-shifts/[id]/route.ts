export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

type Params = { params: Promise<{ id: string }> };
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function PUT(req: Request, { params }: Params) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "work-shifts", "update");
  if (forbid) return forbid;
  const { id } = await params;
  const body = await req.json();
  const scopedTenantId = ensureTenantScope(auth.user);
  const existing = await prisma.workShift.findFirst({ where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) } });
  if (!existing) return NextResponse.json({ message: "Shift tidak ditemukan" }, { status: 404 });
  const startTime = String(body.startTime || "");
  const endTime = String(body.endTime || "");
  const lateToleranceMinutes = body.lateToleranceMinutes === null || body.lateToleranceMinutes === "" ? null : Number(body.lateToleranceMinutes);
  if (!String(body.name || "").trim() || !timeRegex.test(startTime) || !timeRegex.test(endTime) || startTime === endTime) return NextResponse.json({ message: "Data shift tidak valid" }, { status: 400 });
  if (lateToleranceMinutes !== null && (!Number.isInteger(lateToleranceMinutes) || lateToleranceMinutes < 0)) return NextResponse.json({ message: "Toleransi terlambat tidak valid" }, { status: 400 });
  try {
    const shift = await prisma.workShift.update({ where: { id }, data: { name: String(body.name).trim(), code: String(body.code || "").trim().toUpperCase() || null, startTime, endTime, crossesMidnight: endTime <= startTime, lateToleranceMinutes, isActive: body.isActive !== false } });
    return NextResponse.json({ data: shift, message: "Shift berhasil diperbarui" });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ message: "Nama atau kode shift sudah digunakan" }, { status: 409 });
    return NextResponse.json({ message: "Gagal memperbarui shift" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "work-shifts", "delete");
  if (forbid) return forbid;
  const { id } = await params;
  const scopedTenantId = ensureTenantScope(auth.user);
  const existing = await prisma.workShift.findFirst({ where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) }, include: { _count: { select: { schedules: true } } } });
  if (!existing) return NextResponse.json({ message: "Shift tidak ditemukan" }, { status: 404 });
  if (existing._count.schedules > 0) return NextResponse.json({ message: "Shift sudah memiliki jadwal. Nonaktifkan shift agar riwayat tetap aman." }, { status: 409 });
  await prisma.workShift.delete({ where: { id } });
  return NextResponse.json({ message: "Shift berhasil dihapus" });
}
