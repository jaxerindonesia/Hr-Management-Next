export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { hasPermission } from "@/lib/auth/permission";
import { BUCKET_AVATARS, uploadBase64ToMinio, uploadBufferToMinio } from "@/lib/minio";
import { buildTenantStorageObjectName } from "@/lib/helper/storage";
import { validateAttachmentBuffer, validateBase64Image } from "@/lib/security/file-validation";

export async function POST(req: Request) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const formData = await req.formData();
    const overtimeId = String(formData.get("overtimeId") || "").trim();
    const userId = String(formData.get("userId") || "").trim();
    const faceCaptureBase64 = String(formData.get("faceCaptureBase64") || "");
    const checkOutLocationRaw = String(formData.get("checkOutLocation") || "");
    const file = formData.get("file") as File | null;
    const canManageOvertimes = hasPermission(auth.user, "overtimes", "update");
    const scopedTenantId = ensureTenantScope(auth.user);

    if (!overtimeId || !userId) {
      return NextResponse.json(
        { message: "overtimeId dan userId wajib diisi" },
        { status: 400 },
      );
    }
    if (!faceCaptureBase64) {
      return NextResponse.json(
        { message: "Bukti foto wajah wajib diisi" },
        { status: 400 },
      );
    }

    const imageValidation = validateBase64Image(faceCaptureBase64, {
      maxBytes: 3 * 1024 * 1024,
    });
    if (!imageValidation.ok) {
      return NextResponse.json({ message: imageValidation.message }, { status: 415 });
    }

    if (!canManageOvertimes && userId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const overtime = await prisma.overtime.findFirst({
      where: {
        id: overtimeId,
        userId: canManageOvertimes ? userId : auth.user.id,
        ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        status: true,
        startTime: true,
      },
    });
    if (!overtime) {
      return NextResponse.json({ message: "Pengajuan lembur tidak ditemukan" }, { status: 404 });
    }
    if (overtime.status !== "CHECKED_IN" || !overtime.startTime) {
      return NextResponse.json(
        { message: "Check out hanya bisa dilakukan setelah check in lembur" },
        { status: 409 },
      );
    }

    let proofUrl: string | null = null;
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

      const proofObjectName = await buildTenantStorageObjectName(
        overtime.tenantId,
        "overtime-proofs",
        `proof-${overtime.id}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`,
      );
      proofUrl = await uploadBufferToMinio(
        buffer,
        proofObjectName,
        BUCKET_AVATARS,
        validation.contentType,
      );
    }

    const checkOutObjectName = await buildTenantStorageObjectName(
      overtime.tenantId,
      "overtime-face",
      `check-out-${randomUUID()}.${imageValidation.extension}`,
    );
    const checkOutFaceImage = await uploadBase64ToMinio(
      faceCaptureBase64,
      checkOutObjectName,
      BUCKET_AVATARS,
      imageValidation.contentType,
    );

    const now = new Date();
    const overtimeMinutes = Math.max(
      0,
      Math.floor((now.getTime() - overtime.startTime.getTime()) / (1000 * 60)),
    );
    const checkOutLocation = checkOutLocationRaw ? JSON.parse(checkOutLocationRaw) : null;

    const updated = await prisma.overtime.update({
      where: { id: overtime.id },
      data: {
        endTime: now,
        overtimeMinutes,
        requestedMinutes: overtimeMinutes,
        checkOutLocation,
        checkOutFaceImage,
        proofUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Check out lembur berhasil",
      data: updated,
    });
  } catch (error) {
    console.error("OVERTIME CHECK OUT ERROR:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gagal check out lembur" },
      { status: 500 },
    );
  }
}
