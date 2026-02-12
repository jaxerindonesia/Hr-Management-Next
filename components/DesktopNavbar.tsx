"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Bell, User, ChevronDown } from "lucide-react";

/**
 * Desktop Navbar Component
 * Displays a fixed top navbar for desktop/laptop screens
 * Shows breadcrumbs, search, notifications, and user profile
 * Only visible on desktop devices (>= 1024px)
 */
export default function DesktopNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = React.useState({
    name: "Admin User",
    role: "Administrator",
  });

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    const titles: { [key: string]: string } = {
      dashboard: "Dashboard",
      employees: "Data Karyawan",
      leaves: "Pengajuan Ketidakhadiran",
      attendance: "Kehadiran",
      payroll: "Payroll",
      performance: "Penilaian Kinerja",
    };
    return titles[path || "dashboard"] || "Dashboard";
  };

  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return now.toLocaleDateString("id-ID", options);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("hr_user_data") || '{}');
    if (user?.name) setUser(user);
  }, []);

  return (
    <nav className="hidden lg:block sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Page Title & Date */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getCurrentDateTime()}
          </p>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* User Profile */}
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left hidden xl:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden xl:block" />
          </button>
        </div>
      </div>
    </nav>
  );
}
