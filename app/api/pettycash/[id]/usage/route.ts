export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { uploadBufferToMinio, BUCKET_AVATARS } from "@/lib/minio";

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const p = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const existing = await prisma.pettyCash.findFirst({
      where: { id: p.id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Petty Cash not found" },
        { status: 404 },
      );
    }

    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdminRole =
      normalizedRole === "superadmin" || normalizedRole === "admin";

    if (!isAdminRole && existing.userId !== auth.user.id) {
      return NextResponse.json(
        { message: "Forbidden: You can only report usage for your own petty cash" },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const description = formData.get("description") as string;
    const amount = formData.get("amount") as string;
    const usageDate = formData.get("usageDate") as string;
    const file = formData.get("file") as File | null;

    if (!description || !amount || !usageDate) {
      return NextResponse.json(
        { message: "Description, amount, and usage date are required" },
        { status: 400 },
      );
    }

    const usage = await prisma.pettyCashUsage.create({
      data: {
        pettyCashId: p.id,
        description,
        amount: Number(amount),
        usageDate: new Date(usageDate),
      },
    });

    let receiptUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `pettycash-receipts/usage-${usage.id}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      
      receiptUrl = await uploadBufferToMinio(
        buffer,
        fileName,
        BUCKET_AVATARS,
        file.type || "application/octet-stream"
      );

      await prisma.pettyCashUsage.update({
        where: { id: usage.id },
        data: { receiptUrl },
      });
    }

    return NextResponse.json(
      {
        message: "Usage reported successfully",
        data: {
          ...usage,
          receiptUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST petty cash usage error:", error);
    return NextResponse.json(
      { message: "Failed to report petty cash usage" },
      { status: 500 },
    );
  }
}
