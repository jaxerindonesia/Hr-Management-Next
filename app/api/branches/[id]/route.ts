export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { generateBranchCode } from "@/lib/helper/branch-code";

function parseBranch(body: Record<string, unknown>) {
  return {
    name: String(body.name || "").trim(), code: String(body.code || "").trim().toUpperCase() || null,
    address: String(body.address || "").trim() || null, latitude: Number(body.latitude),
    longitude: Number(body.longitude), attendanceRadiusMeters: Number(body.attendanceRadiusMeters),
    locationLockEnabled: Boolean(body.locationLockEnabled), customWorkingHoursEnabled: true,
    scheduleType: body.scheduleType === "SHIFT" ? "SHIFT" : "REGULAR",
    officeStartTime: String(body.officeStartTime || "").trim(), officeEndTime: String(body.officeEndTime || "").trim(), isActive: body.isActive !== false,
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

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "branches", "update");
  if (forbid) return forbid;
  const { id } = await params;
  const scopedTenantId = ensureTenantScope(auth.user);
  const existing = await prisma.branch.findFirst({ where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) } });
  if (!existing) return NextResponse.json({ message: "Cabang tidak ditemukan" }, { status: 404 });
  const body = await req.json();
  const data = parseBranch(body);
  const error = validateBranch(data);
  if (error) return NextResponse.json({ message: error }, { status: 400 });
  try {
    const code = data.code ?? await generateBranchCode(data.name, async (candidate) => {
      const duplicate = await prisma.branch.findFirst({
        where: { tenantId: existing.tenantId, code: candidate, id: { not: id } },
        select: { id: true },
      });
      return Boolean(duplicate);
    });
    const { workingSchedules, ...branchData } = data;
    const branch = await prisma.$transaction(async (tx) => {
      await tx.branchWorkingSchedule.deleteMany({ where: { branchId: id } });
      return tx.branch.update({
        where: { id },
        data: {
          ...branchData,
          code,
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
    });
    return NextResponse.json({ message: "Cabang berhasil diperbarui", data: branch });
  } catch (updateError) {
    if ((updateError as { code?: string }).code === "P2002") return NextResponse.json({ message: "Nama atau kode cabang sudah digunakan" }, { status: 409 });
    return NextResponse.json({ message: "Gagal memperbarui cabang" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "branches", "delete");
  if (forbid) return forbid;
  const { id } = await params;
  const scopedTenantId = ensureTenantScope(auth.user);
  const existing = await prisma.branch.findFirst({ where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) }, select: { id: true } });
  if (!existing) return NextResponse.json({ message: "Cabang tidak ditemukan" }, { status: 404 });
  await prisma.branch.delete({ where: { id } });
  return NextResponse.json({ message: "Cabang berhasil dihapus" });
}
