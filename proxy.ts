import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeSessionToken } from "@/lib/auth/jwt-edge";
import { getExpiredAuthCookieOptions } from "@/lib/auth/cookie";
import { isStateChangingRequest, isTrustedOrigin } from "@/lib/security/origin";

const cspBase =
  "default-src 'self'; img-src 'self' data: blob: http://103.31.204.110:1608 https://s3-jaxer.tetrabit.my.id; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

const createNonce = () => crypto.randomUUID().replace(/-/g, "");

const withCsp = (request: NextRequest, response: NextResponse) => {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const csp = `${cspBase}; script-src 'self' 'nonce-${nonce}'`;

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
    headers: response.headers,
  });
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/cron")) {
    return withCsp(request, NextResponse.next());
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
    return withCsp(request, NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (isPublicRoute || isAuthApiRoute) {
    return withCsp(request, NextResponse.next());
  }

  if (isApiRoute && isStateChangingRequest(request.method) && !isTrustedOrigin(request)) {
    return withCsp(
      request,
      NextResponse.json(
        { message: "Forbidden origin" },
        { status: 403 },
      ),
    );
  }

  if (!token || !isValidSession) {
    if (isApiRoute) {
      const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      response.cookies.set("token", "", getExpiredAuthCookieOptions());
      response.cookies.set("remember_me", "", getExpiredAuthCookieOptions());
      return withCsp(request, response);
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("token", "", getExpiredAuthCookieOptions());
    response.cookies.set("remember_me", "", getExpiredAuthCookieOptions());
    return withCsp(request, response);
  }

  return withCsp(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)",
  ],
};
