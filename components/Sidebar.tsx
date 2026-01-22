"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    { id: "employees", name: "Data Karyawan", icon: Users, path: "/employees" },
    { id: "leaves", name: "Cuti/Izin", icon: Calendar, path: "/leaves" },
    {
      id: "payroll",
      name: "Payroll",
      icon: () => <span className="text-sm font-bold">Rp</span>,
      path: "/payroll",
    },
    {
      id: "performance",
      name: "Penilaian Kinerja",
      icon: TrendingUp,
      path: "/performance",
    },
  ];

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarOpen ? "w-80" : "w-20"
      }`}
    >
      {/* ===== HEADER ===== */}
      <div className="h-16 flex items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          {sidebarOpen === true && (
            <Image
              src="/jaxer.png"
              alt="HR System Logo"
              width={36}
              height={36}
              priority
              className="rounded-lg"
            />
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center rounded-lg p-2 transition hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ===== MENU ===== */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && (
                <span className="font-medium truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ===== FOOTER ===== */}
      <div className="border-t p-4">
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition hover:bg-red-50 ${
            sidebarOpen ? "justify-start" : "justify-center"
          }`}
        >
          <LogOut className="w-5 h-5" />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
