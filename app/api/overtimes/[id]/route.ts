export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const item = await prisma.overtime.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      include: {
        user: { select: { id: true, name: true } },
        attendance: { select: { id: true, date: true, checkIn: true, checkOut: true } },
      },
    });

    if (!item) return NextResponse.json({ message: "Overtime not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ message: "Failed to retrieve overtime" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);
    const existing = await prisma.overtime.findFirst({ where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) } });
    if (!existing) return NextResponse.json({ message: "Overtime not found" }, { status: 404 });

    const body = await req.json();
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdmin = ["superadmin", "admin"].includes(normalizedRole);
    if (!isAdmin && existing.userId !== auth.user.id) {
      return NextResponse.json({ message: "Anda tidak memiliki akses ke overtime ini" }, { status: 403 });
    }
    const updateData: any = {};
    if (body.description !== undefined) {
      if (!isAdmin && existing.status !== "PENDING") {
        return NextResponse.json({ message: "Keterangan hanya bisa diubah saat overtime masih menunggu approval" }, { status: 400 });
      }
      updateData.description = body.description;
    }
    if (isAdmin && body.status !== undefined) updateData.status = body.status;
    if (isAdmin && body.rejectReason !== undefined) updateData.rejectReason = body.rejectReason;
    if (isAdmin && body.payMethod !== undefined) updateData.payMethod = body.payMethod;
    if (isAdmin && body.hourlyRate !== undefined) updateData.hourlyRate = Number(body.hourlyRate);
    if (isAdmin && body.dailyRate !== undefined) updateData.dailyRate = Number(body.dailyRate);
    if (isAdmin && body.payoutAmount !== undefined) updateData.payoutAmount = Number(body.payoutAmount);

    if (body.approvalAction) {
      if (!isAdmin) return NextResponse.json({ message: "Anda tidak memiliki akses approval overtime" }, { status: 403 });
      const action = String(body.approvalAction).toUpperCase();
      updateData.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
      updateData.approvedBy = auth.user.id;
      updateData.approvedAt = new Date();
      updateData.rejectReason = updateData.status === "REJECTED" ? String(body.rejectionReason || "").trim() : null;
      if (updateData.status === "REJECTED" && !updateData.rejectReason) {
        return NextResponse.json({ message: "Alasan penolakan wajib diisi" }, { status: 400 });
      }
    }

    const updated = await prisma.overtime.update({ where: { id: p.id }, data: updateData });
    return NextResponse.json({ message: "Overtime updated", data: updated });
  } catch {
    return NextResponse.json({ message: "Failed to update overtime" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.overtime.findFirst({ where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) }, select: { id: true } });
    if (!existing) return NextResponse.json({ message: "Overtime not found" }, { status: 404 });

    await prisma.overtime.delete({ where: { id: p.id } });
    return NextResponse.json({ message: "Overtime deleted" });
  } catch {
    return NextResponse.json({ message: "Failed to delete overtime" }, { status: 500 });
  }
}
