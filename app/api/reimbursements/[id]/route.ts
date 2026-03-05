export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const item = await prisma.reimbursement.findFirst({
      where: { id: p.id },
      include: {
        user: {
          select: { id: true, name: true, position: true, department: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { message: "Reimbursement not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Success", data: item });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve reimbursement" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;

  try {
    const contentType = req.headers.get("content-type") || "";

    let updateData: any = {};
    let removeReceipt = false;
    let newFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const title = formData.get("title");
      const category = formData.get("category");
      const amount = formData.get("amount");
      const date = formData.get("date");
      const description = formData.get("description");
      const status = formData.get("status");
      const approvedBy = formData.get("approvedBy");
      const approvedAt = formData.get("approvedAt");
      removeReceipt = formData.get("removeReceipt") === "true";
      newFile = formData.get("file") as File | null;

      if (title !== null) updateData.title = title;
      if (category !== null) updateData.category = category;
      if (amount !== null) updateData.amount = Number(amount);
      if (date !== null) updateData.date = new Date(date as string);
      if (description !== null) updateData.description = description;
      if (status !== null) updateData.status = status;
      if (approvedBy !== null) updateData.approvedBy = approvedBy;
      if (approvedAt !== null)
        updateData.approvedAt = approvedAt
          ? new Date(approvedAt as string)
          : null;
    } else {
      const body = await req.json();

      if (body.title !== undefined) updateData.title = body.title;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.amount !== undefined) updateData.amount = Number(body.amount);
      if (body.date !== undefined) updateData.date = new Date(body.date);
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.approvedBy !== undefined)
        updateData.approvedBy = body.approvedBy;
      if (body.approvedAt !== undefined)
        updateData.approvedAt = body.approvedAt
          ? new Date(body.approvedAt)
          : null;

      removeReceipt = body.removeReceipt === true;
    }

    console.log(
      "Update Data:",
      p.id,
      updateData,
      "Remove Receipt:",
      removeReceipt,
      "New File:",
      newFile,
    );
    const existing = await prisma.reimbursement.findUnique({
      where: { id: p.id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Data tidak ditemukan" },
        { status: 404 },
      );
    }

    let receiptUrl = existing.receiptUrl;

    if (newFile && newFile.size > 0) {
      const bytes = await newFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `reimbursement-${p.id}-${Date.now()}-${newFile.name}`;
      const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

      await fs.promises.writeFile(uploadPath, buffer);

      receiptUrl = `/uploads/${fileName}`;

      // 🔥 HAPUS FILE LAMA
      if (existing.receiptUrl) {
        const oldPath = path.join(process.cwd(), "public", existing.receiptUrl);
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath);
        }
      }
    }

    if (removeReceipt) {
      if (existing.receiptUrl) {
        const oldPath = path.join(process.cwd(), "public", existing.receiptUrl);
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath);
        }
      }
      receiptUrl = null;
    }

    updateData.receiptUrl = receiptUrl;

    const updated = await prisma.reimbursement.update({
      where: { id: p.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Reimbursement successfully updated",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update reimbursement" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.reimbursement.delete({ where: { id: p.id } });
    return NextResponse.json({ message: "Reimbursement successfully deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete reimbursement" },
      { status: 500 },
    );
  }
}
