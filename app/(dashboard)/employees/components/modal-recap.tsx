"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarOff,
  Clock,
  Loader2,
  Printer,
  X,
  AlertTriangle,
} from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserDto } from "@/lib/dto/user";

type AttendanceDetail = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  notes: string | null;
  workHours: string | null;
};

type SubmissionHistory = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
};

type LeaveQuota = {
  configName: string;
  maxDays: number;
  usedDays: number;
  remainingDays: number;
};

type RecapData = {
  user: { id: string; name: string };
  month: number;
  year: number;
  attendance: {
    summary: {
      totalHadir: number;
      totalTelat: number;
      totalAlpha: number;
      totalIzin: number;
    };
    details: AttendanceDetail[];
  };
  submissions: {
    leaveQuotas: LeaveQuota[];
    history: SubmissionHistory[];
  };
};

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatTime(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "hadir" || s === "present" || s === "tepat waktu") return "bg-green-100 text-green-700";
  if (s === "telat" || s === "late" || s === "terlambat") return "bg-yellow-100 text-yellow-700";
  if (s === "alpha" || s === "absent" || s === "tidak hadir") return "bg-red-100 text-red-700";
  if (s === "izin" || s === "cuti" || s === "sakit" || s === "leave" || s === "sick") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function getSubmissionStatusBadge(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "APPROVED") return "bg-green-100 text-green-700";
  if (s === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function getSubmissionStatusLabel(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "APPROVED") return "Disetujui";
  if (s === "REJECTED") return "Ditolak";
  return "Pending";
}

export default function ModalRecap({
  employee,
  onClose,
}: {
  employee: UserDto;
  onClose: () => void;
}) {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<"attendance" | "submissions">("attendance");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecapData | null>(null);

  const fetchRecap = useCallback(async () => {
    if (!employee.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${employee.id}/recap?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch recap");
      const json = await res.json();
      setData(json.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [employee.id, month, year]);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const summary = data?.attendance.summary;
  const attendanceDetails = data?.attendance.details || [];
  const submissionHistory = data?.submissions.history || [];
  const leaveQuotas = data?.submissions.leaveQuotas || [];

  const handlePrint = () => {
    const attRows = attendanceDetails
      .map(
        (att) => `
          <tr>
            <td>${formatDate(att.date)}</td>
            <td>${formatTime(att.checkIn)}</td>
            <td>${formatTime(att.checkOut)}</td>
            <td>${att.status || "-"}</td>
            <td>${att.workHours || "-"}</td>
            <td>${att.notes || "-"}</td>
          </tr>
        `,
      )
      .join("");

    const subRows = submissionHistory
      .map(
        (sub) => `
          <tr>
            <td>${sub.type}</td>
            <td>${formatDate(sub.startDate)}</td>
            <td>${formatDate(sub.endDate)}</td>
            <td>${sub.reason || "-"}</td>
            <td>${getSubmissionStatusLabel(sub.status)}</td>
            <td>${formatDate(sub.createdAt)}</td>
          </tr>
        `,
      )
      .join("");

    const quotaCards = leaveQuotas
      .map(
        (q) => `
          <div class="quota-card">
            <p class="quota-title">${q.configName}</p>
            <p class="quota-value">${q.remainingDays} <span>/ ${q.maxDays} hari</span></p>
            <p class="quota-used">Terpakai: ${q.usedDays} hari</p>
          </div>
        `,
      )
      .join("");

    const gender =
      employee.gender === "male"
        ? "Laki-laki"
        : employee.gender === "female"
          ? "Perempuan"
          : "-";

    const printHtml = `
      <div id="recap-print-container">
        <style>
          #recap-print-container {
            font-family: Arial, sans-serif;
            color: #111827;
            padding: 24px;
            font-size: 13px;
          }
          #recap-print-container h1 { font-size: 22px; margin: 0 0 6px; }
          #recap-print-container h2 { font-size: 16px; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #2563eb; color: #1e40af; }
          #recap-print-container .profile {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            padding: 16px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
          }
          #recap-print-container .avatar {
            width: 84px;
            height: 84px;
            border-radius: 9999px;
            overflow: hidden;
            background: #e5e7eb;
            flex-shrink: 0;
          }
          #recap-print-container .avatar img { width: 100%; height: 100%; object-fit: cover; }
          #recap-print-container .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px 28px;
            margin-top: 12px;
          }
          #recap-print-container .meta-item { display: flex; flex-direction: column; gap: 2px; }
          #recap-print-container .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; }
          #recap-print-container .value { font-weight: 600; font-size: 14px; }
          #recap-print-container .summary-cards { display: flex; gap: 12px; margin: 12px 0 0; flex-wrap: wrap; }
          #recap-print-container .summary-card { flex: 1; min-width: 160px; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; }
          #recap-print-container .summary-card .num { font-size: 28px; font-weight: 700; margin-top: 6px; }
          #recap-print-container table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          #recap-print-container th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #d1d5db; font-size: 12px; }
          #recap-print-container td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          #recap-print-container .quota-cards { display: flex; gap: 12px; flex-wrap: wrap; }
          #recap-print-container .quota-card { flex: 1; min-width: 180px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
          #recap-print-container .quota-title { margin: 0 0 4px; font-weight: 600; }
          #recap-print-container .quota-value { margin: 0; font-size: 24px; font-weight: 700; color: #2563eb; }
          #recap-print-container .quota-value span { font-size: 14px; color: #6b7280; font-weight: 500; }
          #recap-print-container .quota-used { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
          @page { margin: 15mm; size: A4; }
        </style>

        <div class="profile">
          <div style="flex:1; min-width: 0;">
            <h1>${employee.name}</h1>
            <div style="color:#2563eb; font-weight:600;">${employee.position || "-"} • ${employee.department?.name || "-"}</div>
            <div class="meta">
              <div class="meta-item"><span class="label">NIK</span><span class="value">${employee.nik || "-"}</span></div>
              <div class="meta-item"><span class="label">Gender</span><span class="value">${gender}</span></div>
              <div class="meta-item"><span class="label">Email</span><span class="value">${employee.email || "-"}</span></div>
              <div class="meta-item"><span class="label">Lahir</span><span class="value">${employee.birthPlace ? `${employee.birthPlace}, ` : ""}${employee.birthDate ? formatDate(employee.birthDate as string) : "-"}</span></div>
              <div class="meta-item" style="grid-column: 1 / -1;"><span class="label">Alamat</span><span class="value">${employee.address || "-"}</span></div>
            </div>
          </div>
        </div>

        <h2>Rekap Kehadiran - ${MONTHS[month - 1]} ${year}</h2>
        <div class="summary-cards">
          <div class="summary-card" style="background:#f0fdf4;"><div class="label" style="color:#15803d">Hadir</div><div class="num" style="color:#15803d">${summary?.totalHadir || 0}</div></div>
          <div class="summary-card" style="background:#fefce8;"><div class="label" style="color:#a16207">Telat</div><div class="num" style="color:#a16207">${summary?.totalTelat || 0}</div></div>
          <div class="summary-card" style="background:#fef2f2;"><div class="label" style="color:#b91c1c">Alpha</div><div class="num" style="color:#b91c1c">${summary?.totalAlpha || 0}</div></div>
          <div class="summary-card" style="background:#eff6ff;"><div class="label" style="color:#1d4ed8">Izin/Cuti</div><div class="num" style="color:#1d4ed8">${summary?.totalIzin || 0}</div></div>
        </div>

        <table>
          <thead>
            <tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Status</th><th>Jam Kerja</th><th>Catatan</th></tr>
          </thead>
          <tbody>
            ${attRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px;">Tidak ada data kehadiran</td></tr>'}
          </tbody>
        </table>

        <h2>Pengajuan Ketidakhadiran - Tahun ${year}</h2>
        ${quotaCards ? `<div class="quota-cards">${quotaCards}</div>` : '<p>Tidak ada kuota cuti.</p>'}
        <table>
          <thead>
            <tr><th>Jenis</th><th>Mulai</th><th>Selesai</th><th>Alasan</th><th>Status</th><th>Diajukan</th></tr>
          </thead>
          <tbody>
            ${subRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px;">Tidak ada pengajuan</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const printDiv = document.createElement("div");
    printDiv.id = "temp-print-area";
    printDiv.innerHTML = printHtml;
    document.body.appendChild(printDiv);

    const style = document.createElement("style");
    style.id = "temp-print-style";
    style.innerHTML = `
      @media print {
        body > *:not(#temp-print-area) { display: none !important; }
        #temp-print-area {
          display: block !important;
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          background: white !important;
          z-index: 99999 !important;
        }
        #temp-print-area * { visibility: visible !important; }
        body, html { height: auto !important; overflow: visible !important; background: white !important; }
        @page { margin: 15mm; size: A4; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => window.print(), 250);

    const cleanup = () => {
      if (document.body.contains(printDiv)) document.body.removeChild(printDiv);
      if (document.head.contains(style)) document.head.removeChild(style);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 60000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-black/50 p-0 touch-pan-y sm:items-center sm:p-3 sm:p-4">
      <div className="relative flex h-[100dvh] w-full max-w-[1000px] flex-col overflow-hidden rounded-none border-0 bg-white shadow-2xl dark:bg-gray-900 sm:h-auto sm:max-h-[94vh] sm:w-[98vw] sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-gray-50/90 px-4 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-16 dark:bg-gray-800/40">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 space-y-4 w-full">
                <div className="flex flex-col gap-3 xl:flex-row xl:justify-between xl:items-start">
                  <div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-[2.15rem]">
                      {employee.name}
                    </h2>
                    <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                      {employee.position || "Posisi belum diatur"} • {employee.department?.name || "Departemen belum diatur"}
                    </p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="print-hide flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm self-start"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak / Simpan PDF
                  </button>
                </div>

                <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4 text-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">NIK</span>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold">{employee.nik || "-"}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</span>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold">
                      {employee.gender === "male" ? "Laki-laki" : employee.gender === "female" ? "Perempuan" : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</span>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold break-words">{employee.email || "-"}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lahir</span>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold">
                      {employee.birthPlace ? `${employee.birthPlace}, ` : ""}
                      {employee.birthDate ? formatDate(employee.birthDate as string) : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:col-span-2 xl:col-span-4 border-t dark:border-gray-700/50 pt-3 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alamat</span>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold break-words">{employee.address || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-4 pt-5 sm:px-8">
            <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg h-12 dark:bg-gray-800">
              <button
                onClick={() => setActiveTab("attendance")}
                className={`h-full px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                  activeTab === "attendance"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Rekap Kehadiran
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`h-full px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                  activeTab === "submissions"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Pengajuan Ketidakhadiran
              </button>
            </div>
          </div>

          <div className="shrink-0 px-4 pt-4 sm:px-8">
            <div className="flex flex-wrap gap-3 items-center rounded-xl border dark:border-gray-700 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bulan:</span>
                <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((name, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tahun:</span>
                <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger className="w-[100px] bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 pb-6 pt-4 sm:px-8 sm:pb-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500 dark:text-gray-400">Memuat data...</span>
              </div>
            ) : activeTab === "attendance" ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Ringkasan Kehadiran - {MONTHS[month - 1]} {year}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Hadir</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary?.totalHadir || 0}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Telat</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary?.totalTelat || 0}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">Alpha</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary?.totalAlpha || 0}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Izin/Cuti</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary?.totalIzin || 0}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Detail Kehadiran - {MONTHS[month - 1]} {year}
                  </h3>
                  <div className="overflow-x-auto border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Tanggal</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Jam Masuk</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Jam Keluar</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Status</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Jam Kerja</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceDetails.length > 0 ? (
                          attendanceDetails.map((att) => (
                            <tr key={att.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">{formatDate(att.date)}</td>
                              <td className="p-3 dark:text-gray-300">{formatTime(att.checkIn)}</td>
                              <td className="p-3 dark:text-gray-300">{formatTime(att.checkOut)}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(att.status)}`}>
                                  {att.status || "-"}
                                </span>
                              </td>
                              <td className="p-3 dark:text-gray-300">{att.workHours || "-"}</td>
                              <td className="p-3 dark:text-gray-300 max-w-[220px] truncate">{att.notes || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                              Tidak ada data kehadiran untuk bulan ini
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Ringkasan Pengajuan - Tahun {year}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {leaveQuotas.length > 0 ? (
                      leaveQuotas.map((quota, i) => (
                        <div key={i} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{quota.configName}</p>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quota.remainingDays}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">/ {quota.maxDays} hari</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                quota.remainingDays === 0
                                  ? "bg-red-500"
                                  : quota.remainingDays <= 3
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                              }`}
                              style={{
                                width: `${Math.max(0, (quota.remainingDays / quota.maxDays) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Terpakai: {quota.usedDays} hari</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full border dark:border-gray-700 rounded-lg p-6 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                        Belum ada data kuota cuti.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Riwayat Pengajuan - Tahun {year}
                  </h3>
                  <div className="overflow-x-auto border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Jenis</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Tanggal Mulai</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Tanggal Selesai</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Alasan</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Status</th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">Diajukan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionHistory.length > 0 ? (
                          submissionHistory.map((sub) => (
                            <tr key={sub.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="p-3 dark:text-gray-300 font-medium">{sub.type}</td>
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">{formatDate(sub.startDate)}</td>
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">{formatDate(sub.endDate)}</td>
                              <td className="p-3 dark:text-gray-300 max-w-[220px] truncate">{sub.reason || "-"}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusBadge(sub.status)}`}>
                                  {getSubmissionStatusLabel(sub.status)}
                                </span>
                              </td>
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">{formatDate(sub.createdAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                              Tidak ada pengajuan untuk tahun ini
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
