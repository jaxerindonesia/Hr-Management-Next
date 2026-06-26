export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { BUCKET_AVATARS, uploadBase64ToMinio } from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { getJakartaDayKey } from "@/lib/helper/date";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function hasOpenBreak(breakSessions: unknown) {
  if (!Array.isArray(breakSessions)) return false;
  return breakSessions.some((session) => {
    if (!session || typeof session !== "object") return false;
    return !(session as { breakOut?: string | null }).breakOut;
  });
}

function hasAnyBreakSession(breakSessions: unknown) {
  return Array.isArray(breakSessions) && breakSessions.length > 0;
}

export async function POST(req: NextRequest) {
  let uploadedFaceImage: string | null = null;
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { userId, breakInLocation, faceCaptureBase64 } = body;
    if (!userId) return jsonError("UserId is required", 400);

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;
    const cfg =
      (await prisma.attendanceConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ?? null;
    if (!cfg?.breakEnabled) {
      return jsonError("Fitur absensi istirahat belum diaktifkan", 400);
    }

    const today = new Date();
    const attendanceDay = getJakartaDayKey(today);
    const attendance = await prisma.attendance.findFirst({
      where: {
        ...(finalTenantId ? { tenantId: finalTenantId } : {}),
        userId,
        attendanceDay,
      },
    });
    if (!attendance?.checkIn) return jsonError("Silakan check in terlebih dahulu", 404);
    if (attendance.checkOut) return jsonError("Tidak bisa break setelah check out", 409);
    if (hasAnyBreakSession(attendance.breakSessions)) {
      return jsonError("Break hanya bisa dilakukan satu kali per hari", 409);
    }
    if (hasOpenBreak(attendance.breakSessions)) {
      return jsonError("Masih ada sesi break yang sedang berjalan", 409);
    }

    if (cfg.breakFaceCaptureEnabled && !faceCaptureBase64) {
      return jsonError("Foto break wajib diambil saat config aktif", 400);
    }

    if (faceCaptureBase64) {
      uploadedFaceImage = await uploadBase64ToMinio(
        faceCaptureBase64,
        `attendance-face/break-in-${randomUUID()}.jpg`,
        BUCKET_AVATARS,
        "image/jpeg",
      );
    }

    const now = new Date().toISOString();
    const breakSessions = Array.isArray(attendance.breakSessions)
      ? [
          ...attendance.breakSessions,
          {
            breakIn: now,
            breakOut: null,
            duration: null,
            breakInLocation,
            breakInFaceImage: uploadedFaceImage,
          },
        ]
      : [{
          breakIn: now,
          breakOut: null,
          duration: null,
          breakInLocation,
          breakInFaceImage: uploadedFaceImage,
        }];

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { breakSessions },
    });

    return NextResponse.json({ message: "Break Check In successful", data: updated });
  } catch (error) {
    if (uploadedFaceImage) {
      // best-effort cleanup if persistence failed
    }
    const message = error instanceof Error ? error.message : "Failed to break check in";
    return NextResponse.json({ message }, { status: 500 });
  }
}
