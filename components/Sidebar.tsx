"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

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
      className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? "w-72" : "w-20"}`}
    >
      {/* ===== HEADER ===== */}
      <div className="h-16 flex items-center border-b dark:border-gray-700 px-4">
        <div className="flex-1 flex justify-center items-center">
          <Image
            src={sidebarOpen ? "/logo21.png" : "/jaxer.png"}
            alt="HR System Logo"
            width={sidebarOpen ? 120 : 48}
            height={40}
            priority
            className="transition-all duration-300 ease-in-out object-contain"
          />
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span
                className={`font-medium truncate transition-all duration-200 ${
                  sidebarOpen ? "opacity-100" : "opacity-0 w-0"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ===== FOOTER ===== */}
      <div className="border-t dark:border-gray-700 p-4 space-y-2">
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
          ${sidebarOpen ? "justify-start" : "justify-center"}`}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span
            className={`font-medium transition-all duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            {theme === "light" ? "Mode Gelap" : "Mode Terang"}
          </span>
        </button>

        <button
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400
          ${sidebarOpen ? "justify-start" : "justify-center"}`}
        >
          <LogOut className="w-5 h-5" />
          <span
            className={`font-medium transition-all duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
