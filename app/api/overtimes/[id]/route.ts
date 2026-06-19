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
        approvalDecisions: {
          include: { approverUser: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
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
    const existing = await prisma.overtime.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      include: { approvalDecisions: true },
    });
    if (!existing) return NextResponse.json({ message: "Overtime not found" }, { status: 404 });

    const body = await req.json();
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdmin = ["superadmin", "admin"].includes(normalizedRole);
    const isApprover = existing.approvalDecisions.some((decision) => decision.approverUserId === auth.user.id);
    if (!isAdmin && existing.userId !== auth.user.id && !isApprover) {
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
      const approverUserId = auth.user.id;
      if (!isApprover) return NextResponse.json({ message: "Anda tidak memiliki akses approval overtime" }, { status: 403 });
      const action = String(body.approvalAction).toUpperCase();
      const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
      const rejectReason = nextStatus === "REJECTED" ? String(body.rejectionReason || "").trim() : null;
      if (nextStatus === "REJECTED" && !rejectReason) {
        return NextResponse.json({ message: "Alasan penolakan wajib diisi" }, { status: 400 });
      }

      await prisma.overtimeApprovalDecision.upsert({
        where: { overtimeId_approverUserId: { overtimeId: p.id, approverUserId } },
        create: { overtimeId: p.id, approverUserId, status: nextStatus, reason: rejectReason, decidedAt: new Date() },
        update: { status: nextStatus, reason: rejectReason, decidedAt: new Date() },
      });

      const allDecisions = await prisma.overtimeApprovalDecision.findMany({ where: { overtimeId: p.id } });
      const hasRejected = allDecisions.some((decision) => decision.status === "REJECTED");
      const allApproved = allDecisions.length > 0 && allDecisions.every((decision) => decision.status === "APPROVED");
      const finalStatus = hasRejected ? "REJECTED" : allApproved ? "APPROVED" : "PENDING";
      const paymentData: {
        payMethod?: string;
        hourlyRate?: number;
        dailyRate?: number;
        payoutAmount?: number;
      } = {};

      if (allApproved) {
        const overtimeCfg = await prisma.overtimeConfig.findFirst({
          where: scopedTenantId ? { tenantId: scopedTenantId } : {},
          orderBy: { updatedAt: "desc" },
        });
        const payMethod = String(body.payMethod || "").toUpperCase();
        const rate =
          payMethod === "PER_DAY"
            ? Number(overtimeCfg?.dailyRate || 0)
            : Number(overtimeCfg?.hourlyRate || 0);

        if (!["PER_HOUR", "PER_DAY"].includes(payMethod)) {
          return NextResponse.json({ message: "Metode pembayaran lembur wajib dipilih" }, { status: 400 });
        }
        if (!Number.isFinite(rate) || rate <= 0) {
          return NextResponse.json({ message: "Tarif lembur harus diisi sebelum approval terakhir" }, { status: 400 });
        }

        paymentData.payMethod = payMethod;
        paymentData.hourlyRate = payMethod === "PER_HOUR" ? rate : 0;
        paymentData.dailyRate = payMethod === "PER_DAY" ? rate : 0;
        paymentData.payoutAmount =
          payMethod === "PER_DAY"
            ? rate
            : rate * (existing.overtimeMinutes / 60);
      }

      const updated = await prisma.overtime.update({
        where: { id: p.id },
        data: {
          status: finalStatus,
          approvedBy: approverUserId,
          approvedAt: new Date(),
          rejectReason: hasRejected ? rejectReason : null,
          ...paymentData,
        },
      });
      return NextResponse.json({ message: "Approval overtime berhasil diproses", data: updated });
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
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdmin = ["superadmin", "admin"].includes(normalizedRole);

    if (!isAdmin) {
      return NextResponse.json({ message: "Anda tidak memiliki akses menghapus overtime" }, { status: 403 });
    }

    const existing = await prisma.overtime.findFirst({ where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) }, select: { id: true } });
    if (!existing) return NextResponse.json({ message: "Overtime not found" }, { status: 404 });

    await prisma.overtime.delete({ where: { id: p.id } });
    return NextResponse.json({ message: "Overtime deleted" });
  } catch {
    return NextResponse.json({ message: "Failed to delete overtime" }, { status: 500 });
  }
}
