"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
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
  ChevronDown,
  Wallet,
} from "lucide-react";
import { useAbsenceTypes } from "@/lib/absence-context";

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { absenceTypes } = useAbsenceTypes();

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const menuItems = React.useMemo(
    () => [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        id: "employees",
        name: "Data Karyawan",
        icon: Users,
        path: "/employees",
      },
      {
        id: "leaves",
        name: "Pengajuan Ketidakhadiran",
        icon: Calendar,
        path: "/leaves",
        subItems: [
          ...absenceTypes.map((type) => ({
            name: type,
            path: `/leaves?type=${encodeURIComponent(type)}`,
          })),
          { name: "Form Pengajuan", path: "/leaves?action=new" },
        ],
      },
      {
        id: "payroll",
        name: "Payroll",
        icon: Wallet,
        path: "/payroll",
      },
      {
        id: "performance",
        name: "Penilaian Kinerja",
        icon: TrendingUp,
        path: "/performance",
      },
    ],
    [absenceTypes],
  );

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? "w-72" : "w-20"}`}
    >
      {/* ===== HEADER ===== */}
      <div className="h-16 flex items-center justify-center border-b dark:border-gray-700 px-4">
        {sidebarOpen ? (
          <>
            <div className="flex-1 flex justify-start items-center">
              <Image
                src="/logo21.png"
                alt="HR System Logo"
                width={100}
                height={20}
                priority
                className="transition-all duration-300 ease-in-out object-contain"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Tutup Sidebar"
            >
              <ChevronLeft className="w-8 h-8 p-[6px]" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Buka Sidebar"
          >
            <ChevronRight className="w-8 h-8 p-[6px]" />
          </button>
        )}
      </div>

      {/* ===== MENU ===== */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path ||
            (item.subItems && pathname.startsWith(item.path));
          const isExpanded = expandedMenus.includes(item.id);
          const currentType = searchParams.get("type");
          const currentAction = searchParams.get("action");

          if (item.subItems) {
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => {
                    if (!sidebarOpen) setSidebarOpen(true);
                    toggleMenu(item.id);
                  }}
                  title={!sidebarOpen ? item.name : ""}
                  className={`flex w-full items-center rounded-lg transition-all duration-200 relative group
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  ${sidebarOpen ? "gap-3 px-4 py-3" : "justify-center py-3"}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium truncate flex-1 text-left">
                        {item.name}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}

                  {/* Tooltip for collapsed sidebar */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </button>

                {/* Submenu */}
                {sidebarOpen && (
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? "max-h-[60vh] opacity-100 overflow-y-auto custom-scrollbar"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    <div className="pl-12 pr-4 py-1 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive =
                          (pathname === item.path &&
                            currentType === sub.name) ||
                          (pathname === item.path &&
                            currentAction === "new" &&
                            sub.name === "Form Pengajuan");
                        return (
                          <Link
                            key={sub.name}
                            href={sub.path}
                            className={`block text-sm py-2 px-3 rounded-md transition-colors ${
                              isSubActive
                                ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.path}
              title={!sidebarOpen ? item.name : ""}
              className={`flex w-full items-center rounded-lg transition-all duration-200 relative group
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
              ${sidebarOpen ? "gap-3 px-4 py-3" : "justify-center py-3"}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && (
                <span className="font-medium truncate">{item.name}</span>
              )}

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
      <div className="border-t dark:border-gray-700 p-2 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center rounded-lg px-4 py-3
  transition-all duration-200 relative group
  hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
  ${sidebarOpen ? "gap-3" : "justify-center"}`}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}

          {sidebarOpen && (
            <span className="font-medium">
              {theme === "light" ? "Mode Gelap" : "Mode Terang"}
            </span>
          )}

          {/* Tooltip */}
          {!sidebarOpen && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
              {theme === "light" ? "Mode Gelap" : "Mode Terang"}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
            </div>
          )}
        </button>

        {/* Logout Button */}
        <button
          title={!sidebarOpen ? "Logout" : ""}
          className={`flex w-full items-center rounded-lg px-4 py-3
    transition-all duration-200 relative group
    hover:bg-red-50 dark:hover:bg-red-900/20
    text-red-600 dark:text-red-400
    ${sidebarOpen ? "gap-3" : "justify-center"}`}
        >
          <LogOut className="w-5 h-5" />

          {sidebarOpen && <span className="font-medium">Logout</span>}

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
