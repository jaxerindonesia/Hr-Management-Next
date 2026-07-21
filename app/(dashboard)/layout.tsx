"use client";

import React, { Suspense } from "react";
import AuthSessionGuard from "@/components/auth-session-guard";
import MobileNavbar from "@/components/mobile-navbar";
import DesktopNavbar from "@/components/desktop-navbar";
import DesktopSidebar from "@/components/desktop-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthSessionGuard />

      {/* Mobile Navbar - Only visible on mobile devices */}
      <MobileNavbar />

      <div className="flex h-screen bg-[linear-gradient(180deg,#f9fcff_0%,#eef6ff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_42%,_#111827_100%)]">
        {/* Sidebar - Only visible on desktop/laptop */}
        <div className="hidden lg:block">
          <Suspense
            fallback={
              <div className="h-full w-64 border-r border-slate-200/80 bg-[linear-gradient(180deg,#f9fcff_0%,#eef6ff_100%)] dark:border-gray-700 dark:bg-gray-800" />
            }
          >
            <DesktopSidebar />
          </Suspense>
        </div>

        <main className="flex flex-1 flex-col overflow-auto bg-transparent dark:bg-transparent">
          {/* Desktop Navbar - Only visible on desktop/laptop */}
          <DesktopNavbar />

          {/* Main Content - Responsive padding for mobile/desktop */}
          <div className="flex-1 p-4 pb-20 lg:pl-4 lg:pr-8 lg:pb-8 lg:pt-1">{children}</div>

          {/* Footer - Only visible on desktop */}
          <footer className="hidden lg:block border-t border-slate-200/80 py-3 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Jaxer Teknologi Indonesia.
          </footer>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </>
  );
}
