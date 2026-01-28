"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (formData.email && formData.password) {
        router.push("/dashboard");
      } else {
        setError("Email dan password harus diisi");
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]" />
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)'
          }}
        />
      </div>

      {/* LEFT SIDE - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Glass Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 space-y-8">
            {/* Logo & Title */}
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                  <Image
                    src="/logo22.png"
                    alt="HR System Logo"
                    width={380}
                    height={60}
                    priority
                    className="object-contain relative z-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  Selamat Datang Kembali
                </h2>
                <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Masuk untuk mengakses dashboard Anda
                </p>
              </div>
            </div>

            {/* Error Message with Animation */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-400 animate-[shake_0.5s_ease-in-out]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2 group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-300 ml-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl
                    bg-white/5 text-white
                    placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                    transition-all duration-300"
                    placeholder="nama@perusahaan.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-300 ml-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-14 py-3.5 border border-white/10 rounded-xl
                    bg-white/5 text-white
                    placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                    transition-all duration-300"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center group cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/5 cursor-pointer transition-all"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2.5 block text-sm text-gray-300 cursor-pointer group-hover:text-white transition-colors"
                  >
                    Ingat saya
                  </label>
                </div>

                <button
                  type="button"
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors relative group"
                >
                  <span>Lupa password?</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex justify-center items-center gap-2 py-3.5 px-4 
                rounded-xl text-white font-semibold
                bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 ease-out
                shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]
                overflow-hidden"
                style={{ backgroundSize: '200%', backgroundPosition: '0% center' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundPosition = '100% center'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundPosition = '0% center'}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400 font-medium">
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>

            {/* SSO Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="group flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-xl
                bg-white/5 backdrop-blur-sm text-gray-300
                hover:bg-white/10 hover:border-white/20 hover:scale-105
                transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-semibold text-sm">Google</span>
              </button>

              <button
                type="button"
                className="group flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-xl
                bg-white/5 backdrop-blur-sm text-gray-300
                hover:bg-white/10 hover:border-white/20 hover:scale-105
                transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="font-semibold text-sm">LinkedIn</span>
              </button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-sm text-gray-400 pt-2">
              Belum punya akun?{" "}
              <button className="font-semibold text-blue-400 hover:text-blue-300 transition-colors relative group">
                <span>Daftar sekarang</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
              </button>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-8 text-gray-500 text-xs">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Data Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Enhanced Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Gradient Orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-[float-delayed_8s_ease-in-out_infinite]" />
        
        {/* Content */}
        <div className="relative z-10 text-white p-12 max-w-2xl">
          <div className="space-y-8">
            {/* Main Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-500/30">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Platform HR Jaxer Grup Indonesia</span>
              </div>
              
              <h1 className="text-6xl font-bold leading-tight bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                Kelola HR Anda dengan{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Lebih Mudah
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Sistem manajemen karyawan yang modern, efisien, dan terintegrasi
                untuk membawa perusahaan Anda ke level berikutnya
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: "👥", title: "Manajemen Karyawan", desc: "Database lengkap & terorganisir" },
                { icon: "💰", title: "Payroll Otomatis", desc: "Perhitungan akurat & cepat" },
                { icon: "📅", title: "Cuti & Absensi", desc: "Tracking real-time" },
                { icon: "📊", title: "Laporan Lengkap", desc: "Analytics mendalam" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 
                  hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300
                  hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-2">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{feature.icon}</div>
                    <h3 className="font-bold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-6">
              {[
                { value: "10+", label: "Karyawa Aktif" },
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Support" },
              ].map((stat, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}