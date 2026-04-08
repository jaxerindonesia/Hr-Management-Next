export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { BUCKET_AVATARS, uploadBase64ToMinio } from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

const DEFAULT_CONFIG = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
};

function getDateAtTime(baseDate: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export async function POST(req: Request) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { userId, checkInLocation, faceCaptureBase64 } = body;

    if (!userId) {
      return NextResponse.json({ message: "UserId is required" }, { status: 400 });
    }
    if (!faceCaptureBase64) {
      return NextResponse.json(
        { message: "Face capture evidence is required" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const now = new Date();
    const cfg =
      (await prisma.attendanceConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ??
      DEFAULT_CONFIG;
    const officeStart = getDateAtTime(now, cfg.officeStartTime);
    const lateLimit = new Date(officeStart.getTime() + cfg.lateToleranceMinutes * 60 * 1000);
    const checkInStatus = now <= lateLimit ? "On Time" : "Late";

    const checkInFaceImage = await uploadBase64ToMinio(
      faceCaptureBase64,
      `attendance-face/check-in-${randomUUID()}.jpg`,
      BUCKET_AVATARS,
      "image/jpeg",
    );

    const attendance = await prisma.attendance.create({
      data: {
        tenantId: finalTenantId,
        userId,
        date: now,
        checkIn: now,
        status: checkInStatus,
        workHours: "0",
        checkInLocation,
        checkInFaceImage,
      },
    });

    return NextResponse.json(attendance);
  } catch {
    return NextResponse.json(
      { message: "Failed to retrieve attendances data" },
      { status: 500 },
    );
  }
}
