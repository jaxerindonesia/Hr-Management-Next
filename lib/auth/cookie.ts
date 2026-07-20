export function getAuthCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function getAuthCookieOptions(maxAge: number) {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge,
  };
}

export function getExpiredAuthCookieOptions() {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: 0,
  };
}
