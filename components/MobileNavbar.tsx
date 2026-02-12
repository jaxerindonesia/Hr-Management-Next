"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Wallet,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Home,
  ClipboardCheck,
} from "lucide-react";

/**
 * Mobile Navbar Component
 * Displays a fixed top navbar with logo, theme toggle, and hamburger menu
 * Includes a bottom navigation bar for quick access to main sections
 * Only visible on mobile devices (< 1024px)
 */
export default function MobileNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
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
      name: "Ketidakhadiran",
      icon: Calendar,
      path: "/leaves",
    },
    {
      id: "attendance",
      name: "Kehadiran",
      icon: ClipboardCheck,
      path: "/attendance",
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
  ];

  const bottomNavItems = [
    { icon: Home, path: "/dashboard", label: "Home" },
    { icon: Users, path: "/employees", label: "Karyawan" },
    { icon: Calendar, path: "/leaves", label: "Cuti" },
    { icon: Wallet, path: "/payroll", label: "Payroll" },
    { icon: TrendingUp, path: "/performance", label: "Kinerja" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("hr_auth_token");
    localStorage.removeItem("hr_user_data");
    router.push("/login");
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Mobile Top Navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo21.png"
              alt="HR System"
              width={80}
              height={16}
              priority
              className="object-contain"
            />
          </Link>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 top-14"
            onClick={closeMenu}
          />

          {/* Slide-in Menu */}
          <div className="lg:hidden fixed top-14 right-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto mobile-menu-slide mobile-menu-scroll">
            <div className="flex flex-col h-full">
              {/* Menu Items */}
              <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Actions */}
              <div className="border-t dark:border-gray-700 p-4 space-y-2">
                {/* Logout Button */}
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] ${isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className={`text-[10px] mt-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer for content (prevents content from being hidden under fixed navbar) */}
      <div className="lg:hidden h-14" />
    </>
  );
}
