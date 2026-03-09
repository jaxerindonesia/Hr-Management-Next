export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

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

    const reimbursement = await prisma.reimbursement.create({
      data: {
        userId,
        title,
        category,
        amount: Number(amount),
        date: new Date(date),
        description: description || null,
        status: "pending",
      },
    });

    let receiptUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `reimbursement-${reimbursement.id}-${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");

      await mkdir(uploadDir, { recursive: true });
      const uploadPath = path.join(uploadDir, fileName);
      await writeFile(uploadPath, buffer);

      receiptUrl = `/uploads/${fileName}`;

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
