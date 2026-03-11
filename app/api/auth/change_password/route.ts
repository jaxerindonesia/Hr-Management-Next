// app/api/change_password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Semua field wajib diisi." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password baru minimal 8 karakter." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    // Verifikasi password saat ini menggunakan salt yang tersimpan
    const hashedCurrent = await bcrypt.hash(currentPassword, user.salt);
    if (hashedCurrent !== user.password) {
      return NextResponse.json(
        { message: "Password saat ini tidak sesuai." },
        { status: 401 },
      );
    }

    // Cek password baru tidak sama dengan password lama
    const hashedNew = await bcrypt.hash(newPassword, user.salt);
    if (hashedNew === user.password) {
      return NextResponse.json(
        { message: "Password baru tidak boleh sama dengan password lama." },
        { status: 400 },
      );
    }

    // Generate salt baru & hash password baru
    const newSalt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, newSalt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newHashedPassword,
        salt: newSalt,
      },
    });

    return NextResponse.json(
      { message: "The password has been successfully changed" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while changing the password" },
      { status: 500 },
    );
  }
}
