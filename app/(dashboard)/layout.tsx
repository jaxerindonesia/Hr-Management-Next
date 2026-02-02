"use client";

import React, { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavbar from "@/components/MobileNavbar";
import DesktopNavbar from "@/components/DesktopNavbar";
import { AbsenceProvider } from "@/lib/absence-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AbsenceProvider>
      {/* Mobile Navbar - Only visible on mobile devices */}
      <MobileNavbar />
      
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar - Only visible on desktop/laptop */}
        <div className="hidden lg:block">
          <Suspense fallback={<div className="w-64 bg-white dark:bg-gray-800 h-full border-r border-gray-200 dark:border-gray-700" />}>
            <Sidebar />
          </Suspense>
        </div>
        
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Desktop Navbar - Only visible on desktop/laptop */}
          <DesktopNavbar />
          
          {/* Main Content - Responsive padding for mobile/desktop */}
          <div className="p-4 lg:p-8 flex-1 pb-20 lg:pb-8">{children}</div>
          
          {/* Footer - Only visible on desktop */}
          <footer className="hidden lg:block border-t border-gray-200 dark:border-gray-700 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Jaxer Teknologi Indonesia. 
          </footer>
        </main>
      </div>
    </AbsenceProvider>
  );
}
