"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sun,
  Moon,
  User,
  ChevronDown,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
} from "lucide-react";

const PasswordField = ({
  label,
  field,
  showKey,
  passwordForm,
  showPass,
  errors,
  setPasswordForm,
  setShowPass,
}: {
  label: string;
  field: "currentPassword" | "newPassword" | "confirmPassword";
  showKey: "current" | "new" | "confirm";
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  showPass: { current: boolean; new: boolean; confirm: boolean };
  errors: { [key: string]: string };
  setPasswordForm: React.Dispatch<
    React.SetStateAction<{
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>
  >;
  setShowPass: React.Dispatch<
    React.SetStateAction<{ current: boolean; new: boolean; confirm: boolean }>
  >;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative">
      <input
        type={showPass[showKey] ? "text" : "password"}
        value={passwordForm[field]}
        onChange={(e) =>
          setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }))
        }
        className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all
          ${
            errors[field]
              ? "border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
              : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400"
          }`}
        placeholder={`Masukkan ${label.toLowerCase()}`}
      />
      <button
        type="button"
        onClick={() =>
          setShowPass((prev) => ({ ...prev, [showKey]: !prev[showKey] }))
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        {showPass[showKey] ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
    {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
  </div>
);

export default function DesktopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = React.useState({
    name: "Admin User",
    role: "Administrator",
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    const titles: { [key: string]: string } = {
      dashboard: "Dashboard",
      employees: "Data Karyawan",
      submissions: "Pengajuan Ketidakhadiran",
      attendances: "Kehadiran",
      payrolls: "Payroll",
      performances: "Penilaian Kinerja",
      roles: "Roles",
      reimbursements: "Reimbursement",
    };
    return titles[path || "dashboard"] || "Dashboard";
  };

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
    const userData = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    if (userData?.name) setUser(userData);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openPasswordModal = () => {
    setDropdownOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setSuccessMsg("");
    setModalOpen(true);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!passwordForm.currentPassword)
      newErrors.currentPassword = "Password saat ini wajib diisi.";
    if (!passwordForm.newPassword) {
      newErrors.newPassword = "Password baru wajib diisi.";
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = "Password baru minimal 8 karakter.";
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok.";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const userData = JSON.parse(localStorage.getItem("hr_user_data") || "{}");

      const res = await fetch("/api/auth/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.message || "Terjadi kesalahan." });
        return;
      }

      setSuccessMsg("Password berhasil diubah!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setErrors({ general: "Terjadi kesalahan. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("hr_user_data");
      localStorage.removeItem("hr_user_role");
    } catch (err) {
      console.error("LOGOUT ERROR:", err);
    }
    router.push("/login");
  };

  return (
    <>
      <nav className="hidden h-[69px] lg:block sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-2 h-full">
          {/* Left Section */}
          <div className="flex flex-col">
            <h1 className="text-[20px] font-bold text-gray-900 dark:text-white">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getCurrentDateTime()}
            </p>
          </div>

          {/* Right Section */}
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

            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

            {/* User Profile with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
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
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 hidden xl:block transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={openPasswordModal}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      Ubah Password
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Change Password Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Ubah Password
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Perbarui kata sandi akun Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => !loading && setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {successMsg ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 text-center">
                    {successMsg}
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="mt-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  {errors.general && (
                    <div className="px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.general}
                      </p>
                    </div>
                  )}

                  <PasswordField
                    label="Password Saat Ini"
                    field="currentPassword"
                    showKey="current"
                    passwordForm={passwordForm}
                    showPass={showPass}
                    errors={errors}
                    setPasswordForm={setPasswordForm}
                    setShowPass={setShowPass}
                  />
                  <PasswordField
                    label="Password Baru"
                    field="newPassword"
                    showKey="new"
                    passwordForm={passwordForm}
                    showPass={showPass}
                    errors={errors}
                    setPasswordForm={setPasswordForm}
                    setShowPass={setShowPass}
                  />
                  <PasswordField
                    label="Konfirmasi Password Baru"
                    field="confirmPassword"
                    showKey="confirm"
                    passwordForm={passwordForm}
                    showPass={showPass}
                    errors={errors}
                    setPasswordForm={setPasswordForm}
                    setShowPass={setShowPass}
                  />

                  {/* Footer Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setModalOpen(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
