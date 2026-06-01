export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

export async function GET() {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const submissionTypes = await prisma.submissionType.findMany({
      where: scopedTenantId ? { tenantId: scopedTenantId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        approverConfigs: {
          include: { approverUser: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      message: "Submission types retrieved successfully",
      data: submissionTypes,
    });
  } catch (error) {
    console.error("GET SUBMISSION TYPES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve submission types data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();

    const { name, approverUserIds = [] } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Submission type name is required" },
        { status: 400 }
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const existing = await prisma.submissionType.findFirst({
      where: { name, tenantId: finalTenantId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Submission type already exists" },
        { status: 409 }
      );
    }

    const uniqueApprovers = Array.from(new Set((approverUserIds as string[]).filter(Boolean)));
    let finalApproverUserIds = uniqueApprovers;

    // Fallback: jika tidak dipilih manual, otomatis pakai user dengan role Admin / Super Admin.
    if (finalApproverUserIds.length === 0) {
      const defaultApprovers = await prisma.user.findMany({
        where: {
          ...(finalTenantId ? { tenantId: finalTenantId } : {}),
          role: {
            name: { in: ["Admin", "Super Admin"] },
          },
        },
        select: { id: true },
      });

      finalApproverUserIds = defaultApprovers.map((u) => u.id);
    }

    if (finalApproverUserIds.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada approver yang bisa dipakai. Tambahkan user Admin terlebih dahulu." },
        { status: 400 }
      );
    }

    const submissionType = await prisma.submissionType.create({
      data: {
        name,
        tenantId: finalTenantId,
        approverConfigs: finalApproverUserIds.length
          ? {
              createMany: {
                data: finalApproverUserIds.map((approverUserId) => ({ approverUserId })),
              },
            }
          : undefined,
      },
      include: {
        approverConfigs: {
          include: { approverUser: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Submission type successfully created.",
        data: submissionType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SUBMISSION TYPE ERROR:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "Submission type name masih terkena unique constraint. Jalankan migration terbaru untuk menghapus unique index.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create submission type" },
      { status: 500 }
    );
  }
}
