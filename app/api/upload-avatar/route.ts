export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadBase64ToMinio, BUCKET_AVATARS } from "@/lib/minio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ message: "No image provided" }, { status: 400 });
    }

    // Buat nama unik untuk file di MinIO
    // Folder: face-photos/ di dalam bucket hr-avatars
    const filename = `face-photos/face-${randomUUID()}.jpg`;

    const url = await uploadBase64ToMinio(imageBase64, filename, BUCKET_AVATARS, "image/jpeg");

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
