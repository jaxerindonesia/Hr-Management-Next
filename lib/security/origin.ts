import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isStateChangingRequest(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function isTrustedOrigin(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  const configuredOrigin = process.env.NEXTAUTH_URL?.trim();
  const allowedOrigins = new Set(
    [requestOrigin, configuredOrigin]
      .map((value) => (value ? normalizeOrigin(value) : null))
      .filter((value): value is string => Boolean(value)),
  );

  const originHeader = request.headers.get("origin");
  if (originHeader) {
    const normalizedOrigin = normalizeOrigin(originHeader);
    return normalizedOrigin ? allowedOrigins.has(normalizedOrigin) : false;
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    const normalizedRefererOrigin = normalizeOrigin(refererHeader);
    return normalizedRefererOrigin
      ? allowedOrigins.has(normalizedRefererOrigin)
      : false;
  }

  return false;
}
