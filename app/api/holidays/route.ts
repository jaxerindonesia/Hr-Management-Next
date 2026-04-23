export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const year = new Date().getFullYear();
    // Ambil data hari libur tahun ini dan tahun depan sekaligus
    const [resThis, resNext] = await Promise.all([
      fetch(`https://libur.deno.dev/api?year=${year}`, {
        next: { revalidate: 86400 }, // cache 24 jam
      }),
      fetch(`https://libur.deno.dev/api?year=${year + 1}`, {
        next: { revalidate: 86400 },
      }),
    ]);

    if (!resThis.ok && !resNext.ok) {
      throw new Error("Gagal mengambil data hari libur");
    }

    const [dataThis, dataNext] = await Promise.all([
      resThis.ok ? resThis.json() : [],
      resNext.ok ? resNext.json() : [],
    ]);

    const allHolidays: { date: string; name: string }[] = [
      ...(Array.isArray(dataThis) ? dataThis : []),
      ...(Array.isArray(dataNext) ? dataNext : []),
    ];

    // Filter hanya hari libur yang belum lewat + hitung daysLeft
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = allHolidays
      .map((h) => {
        const [y, m, d] = h.date.split("-").map(Number);
        const target = new Date(y, m - 1, d);
        target.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil(
          (target.getTime() - today.getTime()) / 86400000,
        );
        return { ...h, daysLeft };
      })
      .filter((h) => h.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);

    return NextResponse.json({ data: upcoming });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil data hari libur", error: String(error) },
      { status: 500 },
    );
  }
}
