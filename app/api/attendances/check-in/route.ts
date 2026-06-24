export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import {
  BUCKET_AVATARS,
  deleteFromMinio,
  uploadBase64ToMinio,
} from "@/lib/minio";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { getDateAtTime, getJakartaDayKey } from "@/lib/helper/date";

const DEFAULT_CONFIG = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
};

function jsonError(message: string, status: number, detail?: string) {
  return NextResponse.json(
    {
      message,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function POST(req: Request) {
  let uploadedFaceImage: string | null = null;

  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { userId, checkInLocation, faceCaptureBase64 } = body;

    if (!userId) {
      return jsonError("UserId is required", 400);
    }
    if (!faceCaptureBase64) {
      return jsonError("Face capture evidence is required", 400);
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const finalTenantId = scopedTenantId ?? body.tenantId ?? null;

    const now = new Date();
    const cfg =
      (await prisma.attendanceConfig.findFirst({
        where: finalTenantId ? { tenantId: finalTenantId } : {},
        orderBy: { updatedAt: "desc" },
      })) ?? DEFAULT_CONFIG;
    const officeStart = getDateAtTime(now, cfg.officeStartTime);
    const lateLimit = new Date(
      officeStart.getTime() + cfg.lateToleranceMinutes * 60 * 1000,
    );
    const checkInStatus = now <= lateLimit ? "On Time" : "Late";
    const attendanceDay = getJakartaDayKey(now);

    uploadedFaceImage = await uploadBase64ToMinio(
      faceCaptureBase64,
      `attendance-face/check-in-${randomUUID()}.jpg`,
      BUCKET_AVATARS,
      "image/jpeg",
    );

    const attendance = await prisma.$transaction(async (tx) => {
      const existingToday = await tx.attendance.findFirst({
        where: {
          ...(finalTenantId ? { tenantId: finalTenantId } : {}),
          userId,
          attendanceDay,
        },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
        },
      });

      if (existingToday?.checkIn) {
        const error = new Error("You have already checked in today") as Error & {
          status?: number;
        };
        error.status = 409;
        throw error;
      }

      return tx.attendance.create({
        data: {
          tenantId: finalTenantId,
          userId,
          date: now,
          attendanceDay,
          checkIn: now,
          status: checkInStatus,
          workHours: "0",
          checkInLocation,
          checkInFaceImage: uploadedFaceImage,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Check In successful",
        data: attendance,
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedFaceImage) {
      await deleteFromMinio(uploadedFaceImage);
    }

    const typedError = error as Error & { status?: number };
    const message = getErrorMessage(error);
    if (typedError.status === 409) {
      return jsonError(message, 409);
    }
    if (message === "You have already checked in today") {
      return jsonError(message, 409);
    }

    if (message.includes("Unique constraint") || message.includes("P2002")) {
      return jsonError("Attendance already exists for this user", 409, message);
    }

    if (message.includes("Unauthorized")) {
      return jsonError("Unauthorized", 401, message);
    }

    return jsonError("Failed to create attendance", 500, message);
  }
}
