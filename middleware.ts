import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeSessionToken } from "@/lib/auth/jwt-edge";
import { getExpiredAuthCookieOptions } from "@/lib/auth/cookie";
import { isStateChangingRequest, isTrustedOrigin } from "@/lib/security/origin";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // bypass cron routes
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const publicRoutes = ["/login", "/register"];
  const authApiRoutes = ["/api/auth/login", "/api/auth/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthApiRoute = authApiRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api/");
  const jwtSecret = process.env.JWT_SECRET;

  let isValidSession = false;
  if (token && jwtSecret) {
    const payload = await verifyEdgeSessionToken(token, jwtSecret);
    isValidSession = Boolean(payload?.sub);
  }

  if (isValidSession && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicRoute || isAuthApiRoute) {
    return NextResponse.next();
  }

  if (isApiRoute && isStateChangingRequest(request.method) && !isTrustedOrigin(request)) {
    return NextResponse.json(
      { message: "Forbidden origin" },
      { status: 403 },
    );
  }

  if (!token || !isValidSession) {
    if (isApiRoute) {
      const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      response.cookies.set("token", "", getExpiredAuthCookieOptions());
      response.cookies.set("remember_me", "", getExpiredAuthCookieOptions());
      return response;
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("token", "", getExpiredAuthCookieOptions());
    response.cookies.set("remember_me", "", getExpiredAuthCookieOptions());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)",
  ],
};
