"use client";

import Sidebar from "@/components/Sidebar";
import { AbsenceProvider } from "@/lib/absence-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AbsenceProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="p-8 flex-1">{children}</div>
          <footer className="border-t border-gray-200 dark:border-gray-700 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Jaxer Teknologi Indonesia. 
          </footer>
        </main>
      </div>
    </AbsenceProvider>
  );
}
