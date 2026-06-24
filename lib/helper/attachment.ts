export function normalizeAttachmentType(url: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (/\.(png|jpg|jpeg|webp|gif)$/.test(lower)) return "Foto";
  return "Link";
}
