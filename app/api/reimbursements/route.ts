export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { hasPermission, requirePermission } from "@/lib/auth/permission";
import { uploadBufferToMinio, BUCKET_AVATARS } from "@/lib/minio";
import { validateAttachmentBuffer } from "@/lib/security/file-validation";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "reimbursements", "get-all");
    if (forbid) return forbid;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const where: Prisma.ReimbursementWhereInput = {};
    const scopedTenantId = ensureTenantScope(auth.user);
    if (scopedTenantId) where.tenantId = scopedTenantId;

    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdminRole = normalizedRole !== "karyawan";
    if (!isAdminRole) where.userId = auth.user.id;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, position: true, department: true },
          },
        },
      }),
      prisma.reimbursement.count({ where }),
    ]);

    return NextResponse.json({
      message: "Reimbursements retrieved successfully",
      data: reimbursements,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve reimbursements data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "reimbursements", "create");
    if (forbid) return forbid;

    const formData = await req.formData();

    const userId = formData.get("userId") as string;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const amount = formData.get("amount") as string;
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File | null;

    if (!userId || !title || !category || !amount || !date) {
      return NextResponse.json(
        { message: "Field wajib belum lengkap" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId;
    const canManageReimbursements = hasPermission(auth.user, "reimbursements", "update");
    const targetUserId = canManageReimbursements ? userId : auth.user.id;

    if (!canManageReimbursements && userId !== auth.user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
        ...(finalTenantId ? { tenantId: finalTenantId } : {}),
      },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { message: "User target tidak ditemukan" },
        { status: 404 },
      );
    }

    const reimbursement = await prisma.reimbursement.create({
      data: {
        tenantId: finalTenantId,
        userId: targetUserId,
        title,
        category,
        amount: Number(amount),
        date: new Date(date),
        description: description || null,
        status: "PENDING",
      },
    });

    let receiptUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const validation = validateAttachmentBuffer(
        file.name || "",
        file.type || "application/octet-stream",
        buffer,
      );
      if (!validation.ok) {
        return NextResponse.json({ message: validation.message }, { status: 415 });
      }

      const fileName = `reimbursements/receipt-${reimbursement.id}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      
      receiptUrl = await uploadBufferToMinio(
        buffer,
        fileName,
        BUCKET_AVATARS,
        validation.contentType,
      );

      await prisma.reimbursement.update({
        where: { id: reimbursement.id },
        data: { receiptUrl },
      });
    }

    return NextResponse.json(
      {
        message: "Reimbursement berhasil dibuat",
        data: {
          ...reimbursement,
          receiptUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create reimbursement" },
      { status: 500 },
    );
  }
}
