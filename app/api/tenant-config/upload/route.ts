export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadBase64ToMinio, BUCKET_AVATARS } from "@/lib/minio";
import { requireSessionUser } from "@/lib/auth/tenant";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ message: "No image provided" }, { status: 400 });
    }

    const filename = `company-logos/logo-${randomUUID()}.png`;
    const url = await uploadBase64ToMinio(imageBase64, filename, BUCKET_AVATARS, "image/png");

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Upload tenant logo error:", error);
    return NextResponse.json({ message: "Upload gagal" }, { status: 500 });
  }
}
