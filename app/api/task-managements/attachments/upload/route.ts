export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireSessionUser } from "@/lib/auth/tenant";
import { uploadBufferToMinio, BUCKET_AVATARS } from "@/lib/minio";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".xls",
  ".xlsx",
  ".csv",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
]);

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function isAllowedAttachment(fileName: string) {
  const lower = fileName.toLowerCase();
  return Array.from(ALLOWED_ATTACHMENT_EXTENSIONS).some((ext) => lower.endsWith(ext));
}

function inferKind(fileName: string, mimeType: string) {
  const lower = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "PDF";
  if (mimeType.startsWith("image/")) return "Foto";
  return "File";
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { message: "File maksimal 10 MB" },
        { status: 413 },
      );
    }
    if (!isAllowedAttachment(file.name || "")) {
      return NextResponse.json(
        {
          message: "Format file harus jpg, jpeg, png, pdf, xls, xlsx, csv, doc, docx, ppt, atau pptx",
        },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = safeName(file.name || "attachment");
    const objectKey = `task-attachments/${randomUUID()}-${fileName}`;

    const url = await uploadBufferToMinio(
      buffer,
      objectKey,
      BUCKET_AVATARS,
      file.type || "application/octet-stream",
    );

    return NextResponse.json(
      {
        url,
        objectKey,
        name: file.name || fileName,
        type: inferKind(file.name || fileName, file.type || ""),
        size: file.size,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload task attachment error:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
