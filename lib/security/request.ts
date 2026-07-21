import type { NextRequest } from "next/server";

export function getRequestIp(req: NextRequest | Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}
