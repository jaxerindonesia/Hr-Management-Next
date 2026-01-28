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
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AbsenceProvider>
  );
}
