import { Client } from "minio";

// ── MinIO Client (singleton) ─────────────────────────────────────────────────
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || "1608"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

// ── Bucket names ─────────────────────────────────────────────────────────────
// Satu bucket "hr-manage-system" dengan sub-folder per konteks:
//   face-photos/  → foto wajah karyawan (untuk absensi)
export const BUCKET_AVATARS = process.env.MINIO_BUCKET_AVATARS || "hr-manage-system";

// Public base URL (tanpa trailing slash)
const PUBLIC_URL = (process.env.MINIO_PUBLIC_URL || "http://103.31.204.110:1608").replace(/\/$/, "");

// ── Upload file dari base64 ───────────────────────────────────────────────────
// objectName contoh: "face-photos/face-uuid.jpg"
export async function uploadBase64ToMinio(
  base64Data: string,
  objectName: string,
  bucket: string,
  contentType = "image/jpeg",
): Promise<string> {
  // Strip data URI prefix jika ada
  const pureBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(pureBase64, "base64");

  await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
    "Content-Type": contentType,
  });

  return `${PUBLIC_URL}/${bucket}/${objectName}`;
}

// ── Upload dari Buffer ────────────────────────────────────────────────────────
export async function uploadBufferToMinio(
  buffer: Buffer,
  objectName: string,
  bucket: string,
  contentType = "application/octet-stream",
): Promise<string> {
  await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
    "Content-Type": contentType,
  });

  return `${PUBLIC_URL}/${bucket}/${objectName}`;
}

// ── Hapus object dari MinIO ───────────────────────────────────────────────────
export async function deleteFromMinio(objectUrl: string): Promise<void> {
  try {
    const url = new URL(objectUrl);
    // pathname: /{bucket}/{folder}/{filename}
    const parts = url.pathname.replace(/^\//, "").split("/");
    const bucket = parts[0];
    const objectName = parts.slice(1).join("/");

    if (!bucket || !objectName) return;

    await minioClient.removeObject(bucket, objectName);
  } catch {
    // File tidak ada atau URL tidak valid → abaikan
  }
}

export default minioClient;
