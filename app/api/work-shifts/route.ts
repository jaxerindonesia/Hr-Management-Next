export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseShift(body: Record<string, unknown>) {
  const startTime = String(body.startTime || "").trim();
  const endTime = String(body.endTime || "").trim();
  const tolerance = body.lateToleranceMinutes;
  return {
    branchId: String(body.branchId || ""),
    name: String(body.name || "").trim(),
    code: String(body.code || "").trim().toUpperCase() || null,
    startTime,
    endTime,
    crossesMidnight: endTime <= startTime,
    lateToleranceMinutes: tolerance === null || tolerance === "" || tolerance === undefined ? null : Number(tolerance),
    isActive: body.isActive !== false,
  };
}

function validateShift(data: ReturnType<typeof parseShift>) {
  if (!data.branchId || !data.name) return "Cabang dan nama shift wajib diisi";
  if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) return "Format jam harus HH:mm";
  if (data.startTime === data.endTime) return "Jam masuk dan pulang tidak boleh sama";
  if (data.lateToleranceMinutes !== null && (!Number.isInteger(data.lateToleranceMinutes) || data.lateToleranceMinutes < 0)) return "Toleransi terlambat harus bilangan bulat positif";
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "work-shifts", "get-all");
  if (forbid) return forbid;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Number(searchParams.get("limit") || 10));
  const search = searchParams.get("search") || "";
  const branchId = searchParams.get("branchId") || "";
  const tenantId = ensureTenantScope(auth.user);
  const where: Prisma.WorkShiftWhereInput = {
    ...(tenantId ? { tenantId } : {}),
    ...(branchId ? { branchId } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.workShift.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ branch: { name: "asc" } }, { startTime: "asc" }], include: { branch: { select: { id: true, name: true } } } }),
    prisma.workShift.count({ where }),
  ]);
  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "work-shifts", "create");
  if (forbid) return forbid;
  const body = await req.json();
  const data = parseShift(body);
  const validation = validateShift(data);
  if (validation) return NextResponse.json({ message: validation }, { status: 400 });
  const scopedTenantId = ensureTenantScope(auth.user);
  const branch = await prisma.branch.findFirst({ where: { id: data.branchId, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) } });
  if (!branch) return NextResponse.json({ message: "Cabang tidak ditemukan" }, { status: 404 });
  if (branch.scheduleType !== "SHIFT") return NextResponse.json({ message: "Mode jadwal cabang harus Shifting" }, { status: 400 });
  try {
    const shift = await prisma.workShift.create({ data: { ...data, tenantId: branch.tenantId } });
    return NextResponse.json({ data: shift, message: "Shift berhasil ditambahkan" }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ message: "Nama atau kode shift sudah digunakan di cabang" }, { status: 409 });
    return NextResponse.json({ message: "Gagal menambahkan shift" }, { status: 500 });
  }
}
