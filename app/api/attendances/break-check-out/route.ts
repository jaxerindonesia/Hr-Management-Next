export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BUCKET_AVATARS, uploadBase64ToMinio } from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { getJakartaDayKey } from "@/lib/helper/date";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function formatDuration(start: Date, end: Date) {
  const totalMinutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { userId, breakOutLocation, faceCaptureBase64 } = body;
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
    if (!Array.isArray(attendance.breakSessions) || attendance.breakSessions.length === 0) {
      return jsonError("Belum ada sesi break yang aktif", 409);
    }

    if (cfg.breakFaceCaptureEnabled && !faceCaptureBase64) {
      return jsonError("Foto break wajib diambil saat config aktif", 400);
    }

    const breakOutFaceImage = faceCaptureBase64
      ? await uploadBase64ToMinio(
          faceCaptureBase64,
          `attendance-face/break-out-${randomUUID()}.jpg`,
          BUCKET_AVATARS,
          "image/jpeg",
        )
      : null;

    const sessions = [...attendance.breakSessions] as Array<{
      breakIn: string;
      breakOut?: string | null;
      duration?: string | null;
      breakInLocation?: unknown;
      breakOutLocation?: unknown;
      breakInFaceImage?: string | null;
      breakOutFaceImage?: string | null;
    }>;
    const last = sessions[sessions.length - 1];
    if (!last || last.breakOut) {
      return jsonError("Tidak ada sesi break aktif", 409);
    }

    const now = new Date();
    const breakInDate = new Date(last.breakIn);
    const duration = formatDuration(breakInDate, now);
    sessions[sessions.length - 1] = {
      ...last,
      breakOut: now.toISOString(),
      duration,
      breakOutLocation,
      breakOutFaceImage,
    };

    const totalMinutes = sessions.reduce((sum, session) => {
      if (!session.duration) return sum;
      const [hh, mm] = session.duration.split(":").map(Number);
      return sum + (Number.isFinite(hh) ? hh * 60 : 0) + (Number.isFinite(mm) ? mm : 0);
    }, 0);
    const totalBreakHours = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
      totalMinutes % 60,
    ).padStart(2, "0")}`;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { breakSessions: sessions as Prisma.InputJsonValue, breakDuration: totalBreakHours },
    });

    return NextResponse.json({ message: "Break Check Out successful", data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to break check out";
    return NextResponse.json({ message }, { status: 500 });
  }
}
