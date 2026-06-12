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

    const submission = await prisma.submission.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      include: {
        submissionType: { include: { approverConfigs: { include: { approverUser: { select: { id: true, name: true } } } } } },
        approvalDecisions: true,
      },
    });

    if (!submission) return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    return NextResponse.json(submission);
  } catch {
    return NextResponse.json({ message: "Failed to retrieve submission" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.submission.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      include: { submissionType: { include: { approverConfigs: true } }, approvalDecisions: true },
    });
    if (!existing) return NextResponse.json({ message: "Submission not found" }, { status: 404 });

    const body = await req.json();

    if (body.approvalAction) {
      const approverUserId = auth.user.id;
      const allowed = existing.submissionType.approverConfigs.some((c) => c.approverUserId === approverUserId);
      if (!allowed) return NextResponse.json({ message: "Anda tidak memiliki akses approval pada submission ini" }, { status: 403 });

      const nextStatus = body.approvalAction === "APPROVE" ? "APPROVED" : "REJECTED";
      const rejectReason = nextStatus === "REJECTED" ? (body.rejectionReason || "") : null;
      if (nextStatus === "REJECTED" && !rejectReason) return NextResponse.json({ message: "Alasan penolakan wajib diisi" }, { status: 400 });

      await prisma.submissionApprovalDecision.upsert({
        where: { submissionId_approverUserId: { submissionId: p.id, approverUserId } },
        create: { submissionId: p.id, approverUserId, status: nextStatus, reason: rejectReason, decidedAt: new Date() },
        update: { status: nextStatus, reason: rejectReason, decidedAt: new Date() },
      });

      const allDecisions = await prisma.submissionApprovalDecision.findMany({ where: { submissionId: p.id } });
      const hasRejected = allDecisions.some((d) => d.status === "REJECTED");
      const allApproved =
        existing.submissionType.approverConfigs.length > 0 &&
        allDecisions.length >= existing.submissionType.approverConfigs.length &&
        allDecisions.every((d) => d.status === "APPROVED");

      const finalStatus = hasRejected ? "REJECTED" : allApproved ? "APPROVED" : "PENDING";
      const lastApproverId =
        finalStatus === "APPROVED" || finalStatus === "REJECTED" ? approverUserId : null;

      const updated = await prisma.submission.update({
        where: { id: p.id },
        data: {
          status: finalStatus,
          approvedBy: lastApproverId,
          approvedAt: finalStatus === "PENDING" ? null : new Date(),
        },
      });

      return NextResponse.json({ message: "Approval berhasil diproses", data: updated });
    }

    const updateData: any = {};
    if (body.userId) updateData.userId = body.userId;
    if (body.submissionTypeId) updateData.submissionTypeId = body.submissionTypeId;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.reason) updateData.reason = body.reason;

    const submission = await prisma.submission.update({ where: { id: p.id }, data: updateData });
    return NextResponse.json({ message: "Submission successfully updated", data: submission });
  } catch {
    return NextResponse.json({ message: "Failed to update submission" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.submission.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Submission not found" }, { status: 404 });

    await prisma.submission.delete({ where: { id: p.id } });
    return NextResponse.json({ message: "Submission successfully deleted" });
  } catch {
    return NextResponse.json({ message: "Failed to delete submission" }, { status: 500 });
  }
}
