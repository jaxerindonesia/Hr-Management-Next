export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - ambil konfigurasi perusahaan (singleton)
export async function GET() {
  try {
    const config = await prisma.companyConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      message: "OK",
      data: config ?? null,
    });
  } catch (error) {
    console.error("GET COMPANY CONFIG ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil konfigurasi perusahaan" },
      { status: 500 },
    );
  }
}

// PUT - simpan/update konfigurasi perusahaan
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, logoUrl, logoDarkUrl } = body;

    const existing = await prisma.companyConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const data: any = {
      companyName: companyName ?? null,
    };

    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (logoDarkUrl !== undefined) data.logoDarkUrl = logoDarkUrl;

    const saved = existing
      ? await prisma.companyConfig.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.companyConfig.create({ data });

    return NextResponse.json({
      message: "Konfigurasi perusahaan berhasil disimpan",
      data: saved,
    });
  } catch (error) {
    console.error("PUT COMPANY CONFIG ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan konfigurasi perusahaan" },
      { status: 500 },
    );
  }
}

// DELETE - hapus logo (reset ke logo Jaxer)
export async function DELETE() {
  try {
    const existing = await prisma.companyConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.companyConfig.update({
        where: { id: existing.id },
        data: { logoUrl: null, logoDarkUrl: null, companyName: null },
      });
    }

    return NextResponse.json({
      message: "Logo perusahaan berhasil direset ke logo Jaxer",
    });
  } catch (error) {
    console.error("DELETE COMPANY CONFIG ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mereset konfigurasi" },
      { status: 500 },
    );
  }
}
