export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET single
export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  try {
    const config = await prisma.leaveConfig.findUnique({
      where: { id },
      include: { submissionTypes: { select: { id: true, name: true } } },
    });
    if (!config) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: config });
  } catch {
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT - update konfigurasi
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, maxDays, description, submissionTypeIds } = body;

    if (!name || !maxDays) {
      return NextResponse.json({ message: "Nama dan maksimal hari wajib diisi" }, { status: 400 });
    }

    // Ambil submission types lama untuk disconnect dulu
    const existing = await prisma.leaveConfig.findUnique({
      where: { id },
      include: { submissionTypes: { select: { id: true } } },
    });

    if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

    const oldIds = existing.submissionTypes.map((t) => t.id);
    const newIds: string[] = submissionTypeIds || [];

    const toDisconnect = oldIds.filter((oid) => !newIds.includes(oid));
    const toConnect = newIds.filter((nid) => !oldIds.includes(nid));

    const config = await prisma.leaveConfig.update({
      where: { id },
      data: {
        name,
        maxDays: Number(maxDays),
        description: description || null,
        submissionTypes: {
          disconnect: toDisconnect.map((did) => ({ id: did })),
          connect: toConnect.map((cid) => ({ id: cid })),
        },
      },
      include: {
        submissionTypes: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Berhasil diupdate", data: config });
  } catch (error) {
    console.error("PUT LEAVE CONFIG ERROR:", error);
    return NextResponse.json({ message: "Gagal mengupdate konfigurasi" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.leaveConfig.delete({ where: { id } });
    return NextResponse.json({ message: "Berhasil dihapus" });
  } catch {
    return NextResponse.json({ message: "Gagal menghapus konfigurasi" }, { status: 500 });
  }
}
