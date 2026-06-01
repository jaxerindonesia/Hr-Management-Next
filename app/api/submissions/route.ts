export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const submissionTypeId = searchParams.get("submissionTypeId") || "";

    const where: Prisma.SubmissionWhereInput = {};
    const scopedTenantId = ensureTenantScope(auth.user);
    if (scopedTenantId) where.tenantId = scopedTenantId;

    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdminRole =
      normalizedRole === "superadmin" || normalizedRole === "admin";
    if (!isAdminRole) where.userId = auth.user.id;

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status) where.status = status;
    if (submissionTypeId) where.submissionTypeId = submissionTypeId;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          submissionType: {
            select: {
              id: true,
              name: true,
              approverConfigs: {
                select: { approverUserId: true, approverUser: { select: { id: true, name: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
          },
          approvalDecisions: {
            select: { approverUserId: true, status: true, reason: true, decidedAt: true },
          },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({ message: "Submissions retrieved successfully", data: submissions, total, page, limit });
  } catch {
    return NextResponse.json({ message: "Failed to retrieve submissions data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const body = await req.json();
    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const { userId, submissionTypeId, startDate, endDate, reason, status } = body;
    if (!userId || !status || !submissionTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ message: "All submission fields are required fields" }, { status: 400 });
    }

    const submissionType = await prisma.submissionType.findFirst({
      where: { id: submissionTypeId, ...(finalTenantId ? { tenantId: finalTenantId } : {}) },
      include: {
        leaveConfig: { include: { submissionTypes: { select: { id: true } } } },
        approverConfigs: { select: { approverUserId: true } },
      },
    });

    if (submissionType?.leaveConfig) {
      const config = submissionType.leaveConfig;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const linkedTypeIds = config.submissionTypes.map((t: { id: string }) => t.id);
      const yearStart = new Date(start.getFullYear(), 0, 1);
      const yearEnd = new Date(start.getFullYear(), 11, 31, 23, 59, 59);
      const approvedSubmissions = await prisma.submission.findMany({
        where: {
          ...(finalTenantId ? { tenantId: finalTenantId } : {}),
          userId,
          submissionTypeId: { in: linkedTypeIds },
          status: "APPROVED",
          startDate: { gte: yearStart, lte: yearEnd },
        },
        select: { startDate: true, endDate: true },
      });
      const usedDays = approvedSubmissions.reduce((total: number, sub: { startDate: Date; endDate: Date }) => total + (Math.ceil((new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1), 0);
      const remainingDays = config.maxDays - usedDays;
      if (requestedDays > remainingDays) {
        return NextResponse.json({ message: remainingDays <= 0 ? `Kuota cuti "${config.name}" sudah habis. Sisa: 0 hari dari ${config.maxDays} hari.` : `Permintaan melebihi batas cuti "${config.name}". Sisa kuota: ${remainingDays} hari, Anda mengajukan ${requestedDays} hari.` }, { status: 422 });
      }
    }

    const existing = await prisma.submission.findFirst({
      where: { ...(finalTenantId ? { tenantId: finalTenantId } : {}), userId, submissionTypeId, startDate: new Date(startDate), endDate: new Date(endDate) },
    });
    if (existing) return NextResponse.json({ message: "Submission already exists for this user" }, { status: 409 });

    const approverUserIds = submissionType?.approverConfigs.map((a) => a.approverUserId) ?? [];

    const submission = await prisma.submission.create({
      data: {
        tenantId: finalTenantId,
        userId,
        submissionTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status,
        approvalDecisions: approverUserIds.length
          ? { createMany: { data: approverUserIds.map((approverUserId) => ({ approverUserId, status: "PENDING" })) } }
          : undefined,
      },
    });

    return NextResponse.json({ message: "Submission successfully created.", data: submission }, { status: 201 });
  } catch (error) {
    console.error("POST SUBMISSION ERROR:", error);
    return NextResponse.json({ message: "Failed to create submission" }, { status: 500 });
  }
}
