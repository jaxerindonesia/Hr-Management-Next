export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/tenant";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const ALLOWED_EVENTS = new Set(["ready", "match", "failure"]);
const ALLOWED_MODES = new Set(["check-in", "check-out", "break-in", "break-out"]);
const ALLOWED_SOURCES = new Set(["database", "cache", "image"]);

function parseDuration(value: unknown) {
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 && duration <= 120_000
    ? Math.round(duration)
    : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const rateLimit = await consumeRateLimit({
    key: `face-metrics:${auth.user.id}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) return new NextResponse(null, { status: 204 });

  try {
    const body = await request.json();
    if (!ALLOWED_EVENTS.has(body.event) || !ALLOWED_MODES.has(body.mode)) {
      return NextResponse.json({ message: "Invalid metric" }, { status: 400 });
    }

    const totalMs = parseDuration(body.totalMs);
    if (totalMs === null) {
      return NextResponse.json({ message: "Invalid duration" }, { status: 400 });
    }

    const descriptorSource = ALLOWED_SOURCES.has(body.descriptorSource)
      ? body.descriptorSource
      : null;

    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      category: "face_recognition_performance",
      event: body.event,
      mode: body.mode,
      userId: auth.user.id,
      tenantId: auth.user.tenantId,
      descriptorSource,
      totalMs,
      referenceMs: parseDuration(body.referenceMs),
      cameraMs: parseDuration(body.cameraMs),
      reason: typeof body.reason === "string" ? body.reason.slice(0, 80) : null,
    }));

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "Invalid metric payload" }, { status: 400 });
  }
}
