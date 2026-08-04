export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { generateBranchCode } from "@/lib/helper/branch-code";

function parseBranch(body: Record<string, unknown>) {
  return {
    name: String(body.name || "").trim(),
    code: String(body.code || "").trim().toUpperCase() || null,
    address: String(body.address || "").trim() || null,
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    attendanceRadiusMeters: Number(body.attendanceRadiusMeters),
    locationLockEnabled: Boolean(body.locationLockEnabled),
    customWorkingHoursEnabled: Boolean(body.customWorkingHoursEnabled),
    scheduleType: body.scheduleType === "SHIFT" ? "SHIFT" : "REGULAR",
    officeStartTime: String(body.officeStartTime || "").trim(),
    officeEndTime: String(body.officeEndTime || "").trim(),
    isActive: body.isActive !== false,
    workingSchedules: Array.isArray(body.workingSchedules) ? body.workingSchedules : [],
  };
}

function validateBranch(data: ReturnType<typeof parseBranch>) {
  if (!data.name) return "Nama cabang wajib diisi";
  if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) return "Latitude tidak valid";
  if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) return "Longitude tidak valid";
  if (!Number.isInteger(data.attendanceRadiusMeters) || data.attendanceRadiusMeters < 1) return "Radius absensi minimal 1 meter";
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (data.scheduleType === "REGULAR" && data.workingSchedules.some((schedule) => {
    const row = schedule as Record<string, unknown>;
    return Boolean(row.isWorkDay) && (!timeRegex.test(String(row.startTime || "")) || !timeRegex.test(String(row.endTime || "")));
  })) return "Jam kerja reguler harus menggunakan format HH:mm";
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "branches", "get-all");
  if (forbid) return forbid;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Number(searchParams.get("limit") || 10));
  const search = searchParams.get("search") || "";
  const tenantId = searchParams.get("tenantId") || "";
  const scopedTenantId = ensureTenantScope(auth.user);
  const where: Prisma.BranchWhereInput = {
    ...(scopedTenantId ? { tenantId: scopedTenantId } : tenantId ? { tenantId } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.branch.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" }, include: { tenant: { select: { id: true, companyName: true } }, workingSchedules: { orderBy: { dayOfWeek: "asc" } } } }),
    prisma.branch.count({ where }),
  ]);
  return NextResponse.json({ message: "OK", data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "branches", "create");
  if (forbid) return forbid;
  const body = await req.json();
  const data = parseBranch(body);
  const error = validateBranch(data);
  if (error) return NextResponse.json({ message: error }, { status: 400 });
  const tenantId = ensureTenantScope(auth.user) ?? String(body.tenantId || "");
  if (!tenantId) return NextResponse.json({ message: "Tenant wajib dipilih" }, { status: 400 });
  try {
    const code = data.code ?? await generateBranchCode(data.name, async (candidate) => {
      const existing = await prisma.branch.findFirst({ where: { tenantId, code: candidate }, select: { id: true } });
      return Boolean(existing);
    });
    const { workingSchedules, ...branchData } = data;
    const branch = await prisma.branch.create({
      data: {
        ...branchData,
        customWorkingHoursEnabled: true,
        code,
        tenantId,
        workingSchedules: {
          create: workingSchedules.map((schedule) => {
            const row = schedule as Record<string, unknown>;
            return {
              dayOfWeek: String(row.dayOfWeek || ""),
              isWorkDay: Boolean(row.isWorkDay),
              startTime: Boolean(row.isWorkDay) ? String(row.startTime || "") : null,
              endTime: Boolean(row.isWorkDay) ? String(row.endTime || "") : null,
            };
          }),
        },
      },
      include: { workingSchedules: true },
    });
    return NextResponse.json({ message: "Cabang berhasil ditambahkan", data: branch }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ message: "Nama atau kode cabang sudah digunakan" }, { status: 409 });
    return NextResponse.json({ message: "Gagal menambahkan cabang" }, { status: 500 });
  }
}
