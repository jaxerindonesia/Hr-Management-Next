"use client";

import { useEffect, useState } from "react";

import {
  handleUnauthorizedClient,
  UNAUTHORIZED_EVENT,
} from "@/lib/helper/response-api";

const SESSION_CHECK_INTERVAL_MS = 10000;

export default function AuthSessionGuard() {
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          if (isMounted) setIsAuthorized(false);
          handleUnauthorizedClient();
          return;
        }

        if (!res.ok) {
          return;
        }

        const json = await res.json().catch(() => null);
        const sessionUser = json?.data;
        if (sessionUser) {
          const rawUserData = localStorage.getItem("hr_user_data");
          const rawUserRole = localStorage.getItem("hr_user_role");
          if (!rawUserData || !rawUserRole) {
            localStorage.setItem("hr_user_data", JSON.stringify(sessionUser));
            localStorage.setItem(
              "hr_user_role",
              JSON.stringify(sessionUser.permissions ?? []),
            );
          }
        }

        if (isMounted) setIsAuthorized(true);
      } catch {
        // Ignore temporary network failures and keep current UI state.
      }
    };

    const handleUnauthorized = () => {
      if (isMounted) setIsAuthorized(false);
    };

    verifySession();

    const interval = window.setInterval(verifySession, SESSION_CHECK_INTERVAL_MS);
    window.addEventListener("focus", verifySession);
    document.addEventListener("visibilitychange", verifySession);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", verifySession);
      document.removeEventListener("visibilitychange", verifySession);
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  if (isAuthorized) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm" />
  );
}
