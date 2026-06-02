"use client";

import { useState, useEffect, useRef } from "react";
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
  Receipt,
  Shield,
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

  // Easter egg states
  const [showCredits, setShowCredits] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const clickResetTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        setShowCredits(true);
        return 0;
      }
      return newCount;
    });

    if (clickResetTimer.current) clearTimeout(clickResetTimer.current);
    clickResetTimer.current = setTimeout(() => {
      setLogoClicks(0);
    }, 1500);
  };

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
      id: "submissions",
      name: "Ketidakhadiran",
      icon: Calendar,
      path: "/submissions",
    },
    {
      id: "attendances",
      name: "Kehadiran",
      icon: ClipboardCheck,
      path: "/attendances",
    },
    {
      id: "payrolls",
      name: "Payroll",
      icon: Wallet,
      path: "/payrolls",
    },
    {
      id: "reimbursements",
      name: "Reimbursement",
      icon: Receipt,
      path: "/reimbursements",
    },
    {
      id: "pettycash",
      name: "Petty Cash",
      icon: Wallet,
      path: "/pettycash",
    },
    {
      id: "performances",
      name: "Penilaian Kinerja",
      icon: TrendingUp,
      path: "/performances",
    },
  ];

  const bottomNavItems = [
    { icon: Home, path: "/dashboard", label: "Home" },
    { icon: ClipboardCheck, path: "/attendances", label: "Kehadiran" },
    { icon: Calendar, path: "/submissions", label: "Cuti" },
    { icon: Receipt, path: "/reimbursements", label: "Reimbursement" },
    { icon: TrendingUp, path: "/performances", label: "Kinerja" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local storage
      localStorage.removeItem("hr_user_data");
      localStorage.removeItem("hr_user_role");
    } catch (err) {
      console.error("LOGOUT ERROR:", err);
    }

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
            {/* <Image
              src="/logo21.png"
              alt="HR System"
              width={80}
              height={16}
              priority
              className="object-contain"
            /> */}
            {/* Logo Light */}
            <Image
              src="/logo21.png"
              alt="HR System Logo"
              width={80}
              height={16}
              priority
              className="object-contain dark:hidden"
            />

            {/* Logo Dark */}
            <Image
              src="/logo22.png"
              alt="HR System Logo"
              width={155}
              height={16}
              priority
              className="object-contain hidden dark:block ml-[-1.5rem]"
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
      <>
        {/* Backdrop */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 top-14 transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMenu}
        />

        {/* Slide-in Menu */}
        <div 
          className={`lg:hidden fixed top-14 right-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto mobile-menu-scroll flex flex-col ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path || pathname.startsWith(item.path);

              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
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

          {/* ===== WATERMARK BOTTOM ===== */}
          <div className="px-6 pb-2 mt-auto">
            <div
              onClick={handleLogoClick}
              className="flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400 select-none cursor-pointer"
            >
              <span className="text-xs font-semibold">by</span>
              <Image
                src="/logo21.png"
                alt="Jaxer Watermark"
                width={65}
                height={14}
                className="object-contain dark:hidden mt-0.5"
                unoptimized
              />
              <Image
                src="/logo22.png"
                alt="Jaxer Watermark"
                width={95}
                height={14}
                className="object-contain hidden dark:block mt-0.5"
                unoptimized
              />
            </div>
          </div>

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
      </>

      {/* Mobile Bottom Navigation Bar */}
      <div 
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path || pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`}
                />
                <span
                  className={`text-[10px] mt-1 ${isActive ? "font-semibold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer for content (prevents content from being hidden under fixed navbar) */}
      <div className="lg:hidden h-14" />

      {/* ===== CREDITS MODAL (EASTER EGG) ===== */}
      {showCredits && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowCredits(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-gray-100 dark:border-gray-700">
            {/* Close Button */}
            <button
              onClick={() => setShowCredits(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover:rotate-90 hover:scale-110 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-in zoom-in duration-700 rotate-3">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Website By
              </h3>

              <div className="flex flex-col gap-3 font-semibold text-[15px] text-gray-700 dark:text-gray-200">
                <a href="https://github.com/ahmadasshidiq" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 hover:scale-[1.03] transition-transform duration-300">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 w-2 h-2 rounded-full inline-block mr-3"></span>
                  M. Abu Bakar Ashidiq
                </a>
                <a href="https://www.linkedin.com/in/famadha-nugraha-setyajati-42aaa6287" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 hover:scale-[1.03] transition-transform duration-300">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 w-2 h-2 rounded-full inline-block mr-3"></span>
                  Famadha Nugraha Setyajati
                </a>
                <a href="https://github.com/suryadharmabakti" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 hover:scale-[1.03] transition-transform duration-300">
                  <span className="bg-gradient-to-r from-orange-500 to-rose-500 w-2 h-2 rounded-full inline-block mr-3"></span>
                  Surya Dharma Bakti RM
                </a>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowCredits(false)}
                className="px-8 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 active:scale-95 text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
