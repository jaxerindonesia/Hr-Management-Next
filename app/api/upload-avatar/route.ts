export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadBase64ToMinio, BUCKET_AVATARS } from "@/lib/minio";
import { requireSessionUser } from "@/lib/auth/tenant";
import { hasPermission } from "@/lib/auth/permission";
import { buildTenantStorageObjectName } from "@/lib/helper/storage";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/security/request";
import { validateBase64Image } from "@/lib/security/file-validation";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const canManageUsers =
      hasPermission(auth.user, "users", "create") ||
      hasPermission(auth.user, "users", "update");
    if (!canManageUsers) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const rateLimit = await consumeRateLimit({
      key: `upload:user-avatar:${auth.user.id}:${getRequestIp(req)}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Terlalu banyak upload. Coba lagi beberapa menit lagi." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = await req.json();
    const { imageBase64, tenantId } = body;

    if (!imageBase64) {
      return NextResponse.json({ message: "No image provided" }, { status: 400 });
    }

    const validation = validateBase64Image(imageBase64, { maxBytes: 3 * 1024 * 1024 });
    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 415 });
    }

    // Buat nama unik untuk file di MinIO
    // Folder: face-photos/ di dalam bucket hr-avatars
    const objectName = await buildTenantStorageObjectName(
      auth.user.tenantId ?? tenantId ?? null,
      "avatars",
      `face-${randomUUID()}.${validation.extension}`,
    );

    const url = await uploadBase64ToMinio(
      imageBase64,
      objectName,
      BUCKET_AVATARS,
      validation.contentType,
    );

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
