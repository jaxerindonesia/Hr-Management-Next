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

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status) {
      where.status = status;
    }

    if (submissionTypeId) {
      where.submissionTypeId = submissionTypeId;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true },
          },
          submissionType: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({
      message: "Submissions retrieved successfully",
      data: submissions,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve submissions data" },
      { status: 500 },
    );
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
      return NextResponse.json(
        { message: "All submission fields are required fields" },
        { status: 400 },
      );
    }

    // ── Validasi batas cuti ───────────────────────────────────────────────────
    const submissionType = await prisma.submissionType.findFirst({
      where: { id: submissionTypeId, ...(finalTenantId ? { tenantId: finalTenantId } : {}) },
      include: {
        leaveConfig: {
          include: {
            submissionTypes: { select: { id: true } },
          },
        },
      },
    });

    if (submissionType?.leaveConfig) {
      const config = submissionType.leaveConfig;

      // Hitung hari yang diajukan kali ini (inklusif)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const requestedDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Semua submission type yang terpaut ke konfigurasi yang sama
      const linkedTypeIds = config.submissionTypes.map((t: { id: string }) => t.id);

      // Hitung hari APPROVED user ini dalam tahun yang sama
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

      const usedDays = approvedSubmissions.reduce((total: number, sub: { startDate: Date; endDate: Date }) => {
        const days =
          Math.ceil(
            (new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;
        return total + days;
      }, 0);

      const remainingDays = config.maxDays - usedDays;

      if (requestedDays > remainingDays) {
        return NextResponse.json(
          {
            message:
              remainingDays <= 0
                ? `Kuota cuti "${config.name}" sudah habis. Sisa: 0 hari dari ${config.maxDays} hari.`
                : `Permintaan melebihi batas cuti "${config.name}". Sisa kuota: ${remainingDays} hari, Anda mengajukan ${requestedDays} hari.`,
          },
          { status: 422 },
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const existing = await prisma.submission.findFirst({
      where: {
        ...(finalTenantId ? { tenantId: finalTenantId } : {}),
        userId,
        submissionTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Submission already exists for this user" },
        { status: 409 },
      );
    }

    const submission = await prisma.submission.create({
      data: {
        tenantId: finalTenantId,
        userId,
        submissionTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status,
      },
    });

    return NextResponse.json(
      { message: "Submission successfully created.", data: submission },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST SUBMISSION ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create submission" },
      { status: 500 },
    );
  }
}
