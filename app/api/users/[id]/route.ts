export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { deleteFromMinio } from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

// Helper: hapus file avatar lama dari MinIO
async function deleteOldAvatar(avatarUrl: string | null) {
  if (!avatarUrl) return;
  // Hanya hapus jika URL dari MinIO kita
  const minioBase = process.env.MINIO_PUBLIC_URL || "http://103.31.204.110:1608";
  if (!avatarUrl.startsWith(minioBase)) return;
  await deleteFromMinio(avatarUrl);
}

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve user" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    const { id } = await params;
    const targetUser = await prisma.user.findFirst({
      where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { id: true },
    });
    if (!targetUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const body = await req.json();

    const updateData: any = {};

    if (body.email) updateData.email = body.email;
    if (body.name) updateData.name = body.name;
    if (body.roleId) updateData.roleId = body.roleId;
    if (body.departmentId) updateData.departmentId = body.departmentId;
    if (body.nik) updateData.nik = body.nik;
    if (body.phone) updateData.phone = body.phone;
    if (body.position) updateData.position = body.position;
    if (body.salary !== undefined) updateData.salary = body.salary;
    if (body.status) updateData.status = body.status;

    // Jika avatarUrl diupdate → hapus file lama dari disk terlebih dahulu
    if (body.avatarUrl !== undefined) {
      const newAvatarUrl = body.avatarUrl || null;
      updateData.avatarUrl = newAvatarUrl;

      // Ambil avatarUrl lama dari DB
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { avatarUrl: true },
      });

      const oldAvatarUrl = existingUser?.avatarUrl ?? null;

      // Hapus file lama jika berbeda dengan yang baru
      if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
        await deleteOldAvatar(oldAvatarUrl);
      }
    }

    if (body.joinDate) {
      updateData.joinDate = new Date(body.joinDate);
    }

    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.password, salt);

      updateData.password = hashedPassword;
      updateData.salt = salt;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "User successfully updated",
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const scopedTenantId = ensureTenantScope(auth.user);

    // Ambil avatarUrl sebelum hapus user, untuk cleanup MinIO
    const user = await prisma.user.findFirst({
      where: { id, ...(scopedTenantId ? { tenantId: scopedTenantId } : {}) },
      select: { avatarUrl: true },
    });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    await prisma.user.delete({
      where: { id },
    });

    // Hapus foto wajah dari MinIO setelah user terhapus
    if (user?.avatarUrl) {
      await deleteOldAvatar(user.avatarUrl);
    }

    return NextResponse.json({
      message: "User successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 },
    );
  }
}
