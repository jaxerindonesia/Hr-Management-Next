export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

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

    // Allow employee or admin to add usage
    const normalizedRole = auth.user.roleName.toLowerCase().replace(/\s/g, "");
    const isAdminRole =
      normalizedRole === "superadmin" || normalizedRole === "admin";

    // Employee can only report usage for their own petty cash
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

    // Create PettyCashUsage in DB
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

      const fileName = `pettycash-usage-${usage.id}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");

      await mkdir(uploadDir, { recursive: true });
      const uploadPath = path.join(uploadDir, fileName);
      await writeFile(uploadPath, buffer);

      receiptUrl = `/uploads/${fileName}`;

      await prisma.pettyCashUsage.update({
        where: { id: usage.id },
        data: { receiptUrl },
      });
    }

    // Optionally check if we should auto-transition status?
    // "admin create -> pending, transfer, settle. sedangkan karyawan -> update digunakan untuk apa..."
    // Settle can be done by Admin or maybe automatically when fully used? Let's leave it to the Admin to settle, or as requested.

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
