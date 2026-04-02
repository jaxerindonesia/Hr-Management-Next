"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
  AlertTriangle,
  X,
  Shield,
  ClipboardCheck,
  Receipt,
  Settings,
} from "lucide-react";
import { usePermission } from "@/lib/helper/check-role";

type CompanyConfig = {
  companyName: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
} | null;

export default function Sidebar() {
  const { checkRoleMulti, permissions } = usePermission();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(null);

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Collapse sidebar by default on small screens
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSmall = window.matchMedia("(max-width: 767px)").matches;
      if (isSmall) setSidebarOpen(false);
    }
  }, []);

  // Fetch company config untuk logo sidebar
  useEffect(() => {
    fetch("/api/company-config")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setCompanyConfig(json.data);
      })
      .catch(() => { });
  }, []);

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

  const menuItems = React.useMemo(() => {
    const allItems = [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        id: "users",
        name: "Data Karyawan",
        icon: Users,
        path: "/employees",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "submissions",
        name: "Pengajuan Ketidakhadiran",
        icon: Calendar,
        path: "/submissions",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "attendances",
        name: "Kehadiran",
        icon: ClipboardCheck,
        path: "/attendances",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "payrolls",
        name: "Payroll",
        icon: Wallet,
        path: "/payrolls",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "reimbursements",
        name: "Reimbursement",
        icon: Receipt,
        path: "/reimbursements",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "performances",
        name: "Penilaian Kinerja",
        icon: TrendingUp,
        path: "/performances",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "roles",
        name: "Roles",
        icon: Shield,
        path: "/roles",
        permissions: ["get-all", "get-by-id"],
      },
      {
        id: "settings",
        name: "Pengaturan",
        icon: Settings,
        path: "/settings",
        permissions: ["superadmin"],
        superadminOnly: true,
      },
    ];

    return allItems.filter((item: any) => {
      if (!item.permissions) return true;
      if (item.superadminOnly) {
        // Cek apakah user adalah superadmin berdasarkan nama role
        const raw = typeof window !== "undefined" ? localStorage.getItem("hr_user_data") : null;
        if (raw) {
          try {
            const userData = JSON.parse(raw);
            // Hapus spasi dan jadikan lowercase untuk menyamakan "Super Admin" = "superadmin"
            const roleName = userData?.role?.name?.toLowerCase().replace(/\s/g, '') || "";
            return roleName === "superadmin";
          } catch {
            return false;
          }
        }
        return false;
      }
      return checkRoleMulti(item.id, item.permissions);
    });
  }, [permissions]);

  return (
    <>
      <aside
        className={`flex flex-col bg-white dark:bg-gray-800 border-r md:border-r border-t md:border-t-0 border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "md:w-72" : "md:w-20"} w-full h-full lg:h-screen md:sticky md:top-0 md:overflow-y-auto`}
      >
        {/* ===== HEADER ===== */}
        <div className="h-[69px] flex items-center justify-center border-b dark:border-gray-700 px-4">
          {sidebarOpen ? (
            <>
              <div className="flex-1 flex justify-start items-center relative w-full h-full overflow-hidden">
                {(() => {
                  const hasLight = !!companyConfig?.logoUrl;
                  const hasDark = !!companyConfig?.logoDarkUrl;
                  const showCompanyLogo = hasLight || hasDark;

                  // Jika kita punya logo perusahaan
                  if (showCompanyLogo) {
                    // Coba tentukan logo mana yang dipakai, fallback bila salah satu tidak diupload
                    const activeLogo =
                      theme === "dark"
                        ? companyConfig?.logoDarkUrl || companyConfig?.logoUrl
                        : companyConfig?.logoUrl || companyConfig?.logoDarkUrl;

                    return (
                      <>
                        <Image
                          src={activeLogo as string}
                          alt={companyConfig?.companyName ?? "Company Logo"}
                          width={140}
                          height={45}
                          priority
                          className="object-contain max-h-[45px] w-auto rounded relative z-10"
                          unoptimized
                        />

                      </>
                    );
                  }

                  // Default Logo Jaxer
                  return (
                    <>
                      {/* Logo Jaxer Default - Light */}
                      <Image
                        src="/logo21.png"
                        alt="HR System Logo"
                        width={100}
                        height={20}
                        priority
                        className="object-contain dark:hidden"
                      />

                      {/* Logo Jaxer Default - Dark */}
                      <Image
                        src="/logo22.png"
                        alt="HR System Logo"
                        width={155}
                        height={20}
                        priority
                        className="object-contain hidden dark:block ml-[-1.5rem]"
                      />
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center justify-center rounded-lg p-2 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-8 h-8 p-[6px] transition-transform duration-300" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center rounded-lg p-2 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-8 h-8 p-[6px] transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* ===== MENU ===== */}
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item: any) => {
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
                    className={`flex w-full items-center rounded-lg transition-all duration-300 relative group
                    ${isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }
                    ${sidebarOpen ? "gap-3 px-4 py-3" : "justify-center py-3"}
                    hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    {/* Animated Icon */}
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive
                        ? "scale-110"
                        : "group-hover:scale-110 group-hover:rotate-3"
                        }`}
                    />

                    {sidebarOpen && (
                      <>
                        <span className="font-medium truncate flex-1 text-left">
                          {item.name}
                        </span>

                        <ChevronDown
                          className={`w-4 h-4 transition-all duration-300 ${isExpanded ? "rotate-180" : ""
                            }`}
                        />
                      </>
                    )}
                  </button>

                  {/* Submenu with smooth animation */}
                  {sidebarOpen && (
                    <div
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded
                        ? "max-h-[60vh] opacity-100 mt-1"
                        : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="pl-12 pr-4 py-1 space-y-1">
                        {item.subItems.map((sub: any, index: any) => {
                          const isSubActive =
                            (pathname === item.path &&
                              currentType === sub.name) ||
                            (pathname === item.path &&
                              currentAction === "new" &&
                              sub.name.includes("Form Pengajuan"));

                          const isFormPengajuan =
                            "isSpecial" in sub ? sub.isSpecial : false;

                          return (
                            <Link
                              key={sub.name}
                              href={sub.path}
                              prefetch={false}
                              style={{
                                animationDelay: `${index * 50}ms`,
                              }}
                              className={`block text-sm py-2 px-3 rounded-md transition-all duration-300
                                ${isExpanded ? "animate-in slide-in-from-left-2 fade-in" : ""}
                                ${isFormPengajuan
                                  ? "font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-l-4 border-green-500 hover:scale-[1.02] hover:shadow-md"
                                  : isSubActive
                                    ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 font-medium shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:translate-x-1"
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
                className={`flex w-full items-center rounded-lg transition-all duration-300 relative group
                ${isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                ${sidebarOpen ? "gap-3 px-4 py-3" : "justify-center py-3"}
                hover:scale-[1.02] active:scale-[0.98]`}
              >
                {/* Animated Icon */}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive
                    ? "scale-110"
                    : "group-hover:scale-110 group-hover:rotate-3"
                    }`}
                />

                {sidebarOpen && (
                  <span className="font-medium truncate flex-1">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ===== WATERMARK BOTTOM ===== */}
        <div className={`px-6 pb-3 transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
          <div
            onClick={handleLogoClick}
            className="flex items-center justify-end gap-1.5 opacity-60 hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400 select-none cursor-pointer"

          >
            <span className="text-xs font-semibold">by</span>
            {/* Saat Terang -> Logo Berwarna */}
            <Image
              src="/logo21.png"
              alt="Jaxer Watermark"
              width={65}
              height={14}
              className="object-contain dark:hidden mt-0.5"
              unoptimized
            />
            {/* Saat Gelap -> Logo Putih */}
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

        {/* ===== FOOTER ===== */}
        <div className="border-t dark:border-gray-700 p-2 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex w-full items-center rounded-lg px-4 py-3
              transition-all duration-300 relative group
              hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
              hover:scale-[1.02] active:scale-[0.98]
              ${sidebarOpen ? "gap-3" : "justify-center"}`}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 group-hover:animate-[spin_1s_linear_infinite]" />
            ) : (
              <Sun className="w-5 h-5 group-hover:animate-[spin_1s_linear_infinite]" />
            )}

            {sidebarOpen && (
              <span className="font-medium">
                {theme === "light" ? "Mode Gelap" : "Mode Terang"}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`flex w-full items-center rounded-lg px-4 py-3
              transition-all duration-300 relative group
              hover:bg-red-50 dark:hover:bg-red-900/20
              text-red-600 dark:text-red-400
              hover:scale-[1.02] active:scale-[0.98]
              ${sidebarOpen ? "gap-3" : "justify-center"}`}
          >
            <LogOut className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1" />

            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover:rotate-90 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-in zoom-in duration-500">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Konfirmasi Logout
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Apakah Anda yakin ingin keluar dari sistem? Anda perlu login
                kembali untuk mengakses dashboard.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
