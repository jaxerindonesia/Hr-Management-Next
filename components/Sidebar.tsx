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
          title={sidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
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
              title={!sidebarOpen ? item.name : ""}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 relative group
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
              ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span
                className={`font-medium truncate transition-all duration-200 ${
                  sidebarOpen ? "opacity-100" : "opacity-0 w-0"
                }`}
              >
                {item.name}
              </span>

              {/* Tooltip saat sidebar tertutup */}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ===== FOOTER ===== */}
      <div className="border-t dark:border-gray-700 p-4 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3
  transition-all duration-200 relative group
  ${sidebarOpen ? "justify-start" : "justify-center"}
  hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}

          <span
            className={`font-medium ${sidebarOpen ? "opacity-100" : "hidden"}`}
          >
            {theme === "light" ? "Mode Gelap" : "Mode Terang"}
          </span>
        </button>

        {/* Logout Button */}
        <button
          title={!sidebarOpen ? "Logout" : ""}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3
    transition-all duration-200 relative group
    ${sidebarOpen ? "justify-start" : "justify-center"}
    hover:bg-red-50 dark:hover:bg-red-900/20
    text-red-600 dark:text-red-400`}
        >
          <LogOut className="w-5 h-5" />

          <span className={`font-medium ${sidebarOpen ? "block" : "hidden"}`}>
            Logout
          </span>

          {!sidebarOpen && (
            <div
              className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700
      text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition
      whitespace-nowrap pointer-events-none z-50"
            >
              Logout
              <div
                className="absolute right-full top-1/2 -translate-y-1/2
        border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"
              />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
