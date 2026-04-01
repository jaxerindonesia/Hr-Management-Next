"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Trash2,
  Save,
  Building2,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Moon,
  Sun,
} from "lucide-react";
import Image from "next/image";

type CompanyConfig = {
  id: string;
  companyName: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
} | null;

export default function SettingsPage() {
  const [config, setConfig] = useState<CompanyConfig>(null);
  const [companyName, setCompanyName] = useState("");
  
  // Light Logo States
  const [previewLightUrl, setPreviewLightUrl] = useState<string | null>(null);
  const [imageLightBase64, setImageLightBase64] = useState<string | null>(null);
  
  // Dark Logo States
  const [previewDarkUrl, setPreviewDarkUrl] = useState<string | null>(null);
  const [imageDarkBase64, setImageDarkBase64] = useState<string | null>(null);
  
  const [isDraggingLight, setIsDraggingLight] = useState(false);
  const [isDraggingDark, setIsDraggingDark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  
  const fileInputLightRef = useRef<HTMLInputElement>(null);
  const fileInputDarkRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/company-config");
      const json = await res.json();
      if (json.data) {
        setConfig(json.data);
        setCompanyName(json.data.companyName ?? "");
        setPreviewLightUrl(json.data.logoUrl ?? null);
        setPreviewDarkUrl(json.data.logoDarkUrl ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleFile = (file: File, type: 'light' | 'dark') => {
    if (!file.type.startsWith("image/")) {
      showToast("error", "File harus berupa gambar (PNG, JPG, SVG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Ukuran file maksimal 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'light') {
        setImageLightBase64(base64);
        setPreviewLightUrl(base64);
      } else {
        setImageDarkBase64(base64);
        setPreviewDarkUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropLight = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLight(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, 'light');
  };

  const handleDropDark = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDark(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, 'dark');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = config?.logoUrl ?? null;
      let logoDarkUrl = config?.logoDarkUrl ?? null;

      // Upload logo light baru jika ada
      if (imageLightBase64) {
        const uploadRes = await fetch("/api/company-config/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imageLightBase64 }),
        });
        if (!uploadRes.ok) throw new Error("Upload logo terang gagal");
        const uploadJson = await uploadRes.json();
        logoUrl = uploadJson.url;
      }

      // Upload logo dark baru jika ada
      if (imageDarkBase64) {
        const uploadRes = await fetch("/api/company-config/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imageDarkBase64 }),
        });
        if (!uploadRes.ok) throw new Error("Upload logo gelap gagal");
        const uploadJson = await uploadRes.json();
        logoDarkUrl = uploadJson.url;
      }

      // Simpan konfigurasi
      const saveRes = await fetch("/api/company-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim() || null,
          logoUrl,
          logoDarkUrl,
        }),
      });
      if (!saveRes.ok) throw new Error("Gagal menyimpan");

      setImageLightBase64(null);
      setImageDarkBase64(null);
      await fetchConfig();
      showToast("success", "Konfigurasi berhasil disimpan!");
    } catch (err: any) {
      showToast("error", err.message ?? "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/company-config", { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal mereset");

      setConfig(null);
      setCompanyName("");
      setPreviewLightUrl(null);
      setPreviewDarkUrl(null);
      setImageLightBase64(null);
      setImageDarkBase64(null);
      showToast("success", "Logo berhasil direset ke logo Jaxer!");
    } catch (err: any) {
      showToast("error", err.message ?? "Terjadi kesalahan");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white animate-in slide-in-from-top-4 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-emerald-500"
              : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="font-medium text-sm">{toast.msg}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pengaturan Sistem
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Konfigurasi logo dan identitas perusahaan yang tampil di sidebar
          </p>
        </div>

        {/* Card Konfigurasi Logo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                Informasi & Logo Perusahaan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Logo akan menyesuaikan tema Terang / Gelap. Jika kosong, akan memakai logo Jaxer.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Nama Perusahaan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nama Perusahaan
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Masukkan nama perusahaan..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Logo Terang */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Sun className="w-4 h-4 text-orange-500" />
                  Logo Tema Terang (Berwarna)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLight(true);
                  }}
                  onDragLeave={() => setIsDraggingLight(false)}
                  onDrop={handleDropLight}
                  onClick={() => fileInputLightRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300 text-center
                    ${
                      isDraggingLight
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  <input
                    ref={fileInputLightRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file, 'light');
                    }}
                  />
                  {!previewLightUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Pilih logo <span className="text-blue-600">Terang</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Maks. 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                       <div className="bg-white border rounded p-3 w-full flex justify-center items-center h-20 shadow-sm relative overflow-hidden group">
                          <Image
                            src={previewLightUrl}
                            alt="Logo Light Preview"
                            width={110}
                            height={40}
                            className="object-contain h-12 w-auto"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                            <span className="text-white text-xs font-medium">Ubah Foto</span>
                          </div>
                       </div>
                       <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewLightUrl(config?.logoUrl ?? null);
                            setImageLightBase64(null);
                            if (fileInputLightRef.current) fileInputLightRef.current.value = "";
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium z-10"
                        >
                          Batalkan / Hapus
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Logo Gelap */}
              <div>
                 <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  Logo Tema Gelap (Putih)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingDark(true);
                  }}
                  onDragLeave={() => setIsDraggingDark(false)}
                  onDrop={handleDropDark}
                  onClick={() => fileInputDarkRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300 text-center
                    ${
                      isDraggingDark
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  <input
                    ref={fileInputDarkRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file, 'dark');
                    }}
                  />
                  {!previewDarkUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Pilih logo <span className="text-blue-600">Gelap</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Maks. 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                       <div className="bg-gray-800 border-gray-700 border rounded p-3 w-full flex justify-center items-center h-20 shadow-sm relative overflow-hidden group">
                          <Image
                            src={previewDarkUrl}
                            alt="Logo Dark Preview"
                            width={110}
                            height={40}
                            className="object-contain h-12 w-auto"
                            unoptimized
                          />
                           <div className="absolute inset-0 bg-white/20 hidden group-hover:flex items-center justify-center transition-all">
                            <span className="text-white text-xs font-medium">Ubah Foto</span>
                          </div>
                       </div>
                       <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDarkUrl(config?.logoDarkUrl ?? null);
                            setImageDarkBase64(null);
                            if (fileInputDarkRef.current) fileInputDarkRef.current.value = "";
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium z-10"
                        >
                          Batalkan / Hapus
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
              </button>

              {(config?.logoUrl || config?.logoDarkUrl) && (
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  {isResetting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isResetting ? "Mereset..." : "Reset ke Logo Jaxer"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
            i
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Cara kerja logo perusahaan (Dual Theme):</p>
            <ul className="space-y-1 text-blue-600 dark:text-blue-400 mt-2">
              <li><Sun className="inline w-4 h-4"/> <strong>Logo Terang:</strong> Muncul saat pengguna menggunakan Light Mode. Biasanya dengan logo berwarna/gelap.</li>
              <li><Moon className="inline w-4 h-4"/> <strong>Logo Gelap:</strong> Muncul saat pengguna menekan Dark Mode. Biasanya dengan logo dominan putih.</li>
              <li>Watermark <strong>Logo Jaxer</strong> kecil akan muncul pada kedua logo secara otomatis di pojok kanan bawah.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
