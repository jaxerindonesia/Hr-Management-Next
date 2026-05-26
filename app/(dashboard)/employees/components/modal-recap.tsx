"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDto } from "@/lib/dto/user";
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CalendarOff,
  Loader2,
  Printer,
} from "lucide-react";

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
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
  if (s === "hadir" || s === "present" || s === "tepat waktu") {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
  if (s === "telat" || s === "late" || s === "terlambat") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  if (s === "alpha" || s === "absent" || s === "tidak hadir") {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
  if (s === "izin" || s === "cuti" || s === "sakit" || s === "leave" || s === "sick") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
}

function getSubmissionStatusBadge(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "APPROVED") {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
  if (s === "REJECTED") {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
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

  const handlePrint = () => {
    // Siapkan data
    const attData = data?.attendance?.details || [];
    const attRows = attData.map((att) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatDate(att.date)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatTime(att.checkIn)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatTime(att.checkOut)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${att.status || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${att.workHours || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${att.notes || "-"}</td>
      </tr>
    `).join("");

    const subData = data?.submissions?.history || [];
    const subRows = subData.map((sub) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${sub.type}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatDate(sub.startDate)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatDate(sub.endDate)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${sub.reason || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${getSubmissionStatusLabel(sub.status)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatDate(sub.createdAt)}</td>
      </tr>
    `).join("");

    const quotaData = data?.submissions?.leaveQuotas || [];
    const quotaCards = quotaData.map((q) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;flex:1;min-width:180px">
        <p style="font-weight:600;margin:0 0 4px">${q.configName}</p>
        <p style="font-size:24px;font-weight:700;color:#2563eb;margin:0">${q.remainingDays} <span style="font-size:14px;color:#6b7280">/ ${q.maxDays} hari</span></p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Terpakai: ${q.usedDays} hari</p>
      </div>
    `).join("");

    const s = data?.attendance?.summary || { totalHadir: 0, totalTelat: 0, totalAlpha: 0, totalIzin: 0 };
    const gender = employee.gender === "male" ? "Laki-laki" : employee.gender === "female" ? "Perempuan" : "-";
    const birthInfo = (employee.birthPlace ? employee.birthPlace + ", " : "") + (employee.birthDate ? formatDate(employee.birthDate as any) : "-");

    const html = `
      <div id="recap-print-container" style="font-family: Arial, sans-serif; color: #1f2937; padding: 20px; font-size: 13px;">
        <style>
          #recap-print-container h1 { font-size: 20px; margin-bottom: 4px; }
          #recap-print-container h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #2563eb; color: #1e40af; }
          #recap-print-container table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          #recap-print-container th { background: #f3f4f6; padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; font-size: 12px; }
          #recap-print-container .profile { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; }
          #recap-print-container .avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #9ca3af; overflow: hidden; }
          #recap-print-container .avatar img { width: 100%; height: 100%; object-fit: cover; }
          #recap-print-container .info-grid { display: flex; flex-wrap: wrap; gap: 16px 40px; font-size: 13px; margin-top: 12px; }
          #recap-print-container .info-item { display: flex; flex-direction: column; gap: 2px; }
          #recap-print-container .label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
          #recap-print-container .val { color: #111827; font-weight: 600; font-size: 14px; }
          #recap-print-container .summary-cards { display: flex; gap: 12px; margin: 12px 0; }
          #recap-print-container .summary-card { flex: 1; padding: 12px; border-radius: 8px; text-align: center; }
          #recap-print-container .num { font-size: 28px; font-weight: 700; }
          #recap-print-container .lbl { font-size: 11px; font-weight: 600; }
          #recap-print-container .green { background: #dcfce7; color: #15803d; }
          #recap-print-container .yellow { background: #fef9c3; color: #a16207; }
          #recap-print-container .red { background: #fee2e2; color: #b91c1c; }
          #recap-print-container .blue { background: #dbeafe; color: #1d4ed8; }
          #recap-print-container .quota-cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
        </style>

        <div class="profile">
          <div class="avatar">
            ${employee.avatarUrl ? `<img src="${employee.avatarUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" /><span style="display:none">${employee.name.charAt(0).toUpperCase()}</span>` : employee.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex:1">
            <h1>${employee.name}</h1>
            <p style="color:#2563eb;font-weight:500;margin-bottom:12px">${employee.position || "-"} &bull; ${employee.department?.name || "-"}</p>
            <div class="info-grid">
              <div class="info-item"><span class="label">NIK</span> <span class="val">${employee.nik || "-"}</span></div>
              <div class="info-item"><span class="label">Gender</span> <span class="val">${gender}</span></div>
              <div class="info-item"><span class="label">Email</span> <span class="val">${employee.email || "-"}</span></div>
              <div class="info-item"><span class="label">Lahir</span> <span class="val">${birthInfo}</span></div>
              <div class="info-item" style="width: 100%; border-top: 1px solid #eee; padding-top: 8px;"><span class="label">Alamat</span> <span class="val">${employee.address || "-"}</span></div>
            </div>
          </div>
        </div>

        <h2>Rekap Kehadiran &mdash; ${MONTHS[month - 1]} ${year}</h2>
        <div class="summary-cards">
          <div class="summary-card green"><div class="num">${s.totalHadir}</div><div class="lbl">Hadir</div></div>
          <div class="summary-card yellow"><div class="num">${s.totalTelat}</div><div class="lbl">Telat</div></div>
          <div class="summary-card red"><div class="num">${s.totalAlpha}</div><div class="lbl">Alpha</div></div>
          <div class="summary-card blue"><div class="num">${s.totalIzin}</div><div class="lbl">Izin/Cuti</div></div>
        </div>
        <table>
          <thead><tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Status</th><th>Jam Kerja</th><th>Catatan</th></tr></thead>
          <tbody>${attRows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#9ca3af">Tidak ada data kehadiran</td></tr>'}</tbody>
        </table>

        <h2>Pengajuan Ketidakhadiran &mdash; Tahun ${year}</h2>
        ${quotaCards ? `<p style="font-weight:600;margin:8px 0 4px">Sisa Kuota Cuti</p><div class="quota-cards">${quotaCards}</div>` : ""}
        <table>
          <thead><tr><th>Jenis</th><th>Mulai</th><th>Selesai</th><th>Alasan</th><th>Status</th><th>Diajukan</th></tr></thead>
          <tbody>${subRows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#9ca3af">Tidak ada pengajuan</td></tr>'}</tbody>
        </table>
      </div>
    `;

    // 1. Buat kontainer cetak dan tambahkan ke body
    const printDiv = document.createElement("div");
    printDiv.id = "temp-print-area";
    printDiv.innerHTML = html;
    document.body.appendChild(printDiv);

    // 2. Buat style khusus untuk menyembunyikan semua elemen kecuali area cetak
    const style = document.createElement("style");
    style.id = "temp-print-style";
    style.innerHTML = `
      @media print {
        body > *:not(#temp-print-area) { display: none !important; }
        #temp-print-area { 
          display: block !important; 
          visibility: visible !important;
          position: absolute !important; 
          top: 0 !important; 
          left: 0 !important; 
          width: 100% !important; 
          background: white !important; 
          z-index: 99999 !important; 
        }
        #temp-print-area * { visibility: visible !important; }
        body, html { 
          height: auto !important; 
          overflow: visible !important; 
          background: white !important;
        }
        @page { margin: 15mm; size: A4; }
      }
    `;
    document.head.appendChild(style);

    // 3. Beri waktu browser untuk merender DOM baru, lalu panggil print
    setTimeout(() => {
      window.print();
    }, 250);

    // 4. Bersihkan kembali DOM SETELAH proses pencetakan selesai atau dibatalkan
    const cleanup = () => {
      if (document.body.contains(printDiv)) document.body.removeChild(printDiv);
      if (document.head.contains(style)) document.head.removeChild(style);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    
    // Fallback cleanup (jika browser tidak mendukung afterprint dengan baik)
    setTimeout(cleanup, 60000); // Hapus setelah 1 menit maksimal
  };

  const fetchRecap = useCallback(async () => {
    if (!employee.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${employee.id}/recap?month=${month}&year=${year}`
      );
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sr-only">
            Rekap Karyawan — {employee.name}
          </DialogTitle>
        </DialogHeader>

        {/* Profile Card */}
        <div className="flex flex-col md:flex-row gap-6 items-start bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border dark:border-gray-700">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-sm shrink-0 bg-gray-200 flex items-center justify-center">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-3xl font-bold text-gray-400 ${employee.avatarUrl ? 'hidden' : ''}`}>
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 space-y-3 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {employee.name}
                </h2>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {employee.position || "Posisi belum diatur"} • {employee.department?.name || "Departemen belum diatur"}
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="print-hide flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>

            <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm">
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">NIK</span>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">{employee.nik || "-"}</span>
              </div>
              <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</span>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">{employee.gender === "male" ? "Laki-laki" : employee.gender === "female" ? "Perempuan" : "-"}</span>
              </div>
              <div className="flex flex-col min-w-[200px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</span>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">{employee.email || "-"}</span>
              </div>
              <div className="flex flex-col min-w-[150px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lahir</span>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">
                  {employee.birthPlace ? `${employee.birthPlace}, ` : ""}
                  {employee.birthDate ? formatDate(employee.birthDate as any) : "-"}
                </span>
              </div>
              <div className="flex flex-col w-full border-t dark:border-gray-700/50 pt-3 mt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alamat</span>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">{employee.address || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "attendance"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
          >
            Rekap Kehadiran
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "submissions"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
          >
            Pengajuan Ketidakhadiran
          </button>
        </div>

        {/* Filter Bulan & Tahun */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bulan:</span>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
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
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              Memuat data...
            </span>
          </div>
        ) : (
          <>
            {/* ═══ TAB KEHADIRAN ═══ */}
            {activeTab === "attendance" && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        Hadir
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {summary?.totalHadir || 0}
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        Telat
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {summary?.totalTelat || 0}
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        Alpha
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {summary?.totalAlpha || 0}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        Izin/Cuti
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {summary?.totalIzin || 0}
                    </p>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                        <th className="text-left p-3 font-semibold dark:text-gray-300">
                          Tanggal
                        </th>
                        <th className="text-left p-3 font-semibold dark:text-gray-300">
                          Jam Masuk
                        </th>
                        <th className="text-left p-3 font-semibold dark:text-gray-300">
                          Jam Keluar
                        </th>
                        <th className="text-left p-3 font-semibold dark:text-gray-300">
                          Status
                        </th>
                        <th className="text-left p-3 font-semibold dark:text-gray-300">
                          Jam Kerja
                        </th>
                        <th className="text-left p-3 font-semibold dark:text-gray-300">
                          Catatan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceDetails.length > 0 ? (
                        attendanceDetails.map((att) => (
                          <tr
                            key={att.id}
                            className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="p-3 dark:text-gray-300 whitespace-nowrap">
                              {formatDate(att.date)}
                            </td>
                            <td className="p-3 dark:text-gray-300">
                              {formatTime(att.checkIn)}
                            </td>
                            <td className="p-3 dark:text-gray-300">
                              {formatTime(att.checkOut)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                  att.status
                                )}`}
                              >
                                {att.status || "-"}
                              </span>
                            </td>
                            <td className="p-3 dark:text-gray-300">
                              {att.workHours || "-"}
                            </td>
                            <td className="p-3 dark:text-gray-300 max-w-[150px] truncate">
                              {att.notes || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-gray-500 dark:text-gray-400"
                          >
                            Tidak ada data kehadiran untuk bulan ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══ TAB PENGAJUAN KETIDAKHADIRAN ═══ */}
            {activeTab === "submissions" && (
              <div className="space-y-4">
                {/* Leave Quota Cards */}
                {leaveQuotas.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Sisa Kuota Cuti — Tahun {year}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {leaveQuotas.map((quota, i) => (
                        <div
                          key={i}
                          className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                        >
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {quota.configName}
                          </p>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {quota.remainingDays}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
                              / {quota.maxDays} hari
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${quota.remainingDays === 0
                                ? "bg-red-500"
                                : quota.remainingDays <= 3
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                                }`}
                              style={{
                                width: `${Math.max(
                                  0,
                                  (quota.remainingDays / quota.maxDays) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Terpakai: {quota.usedDays} hari
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission History Table */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Riwayat Pengajuan — Tahun {year}
                  </h3>
                  <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                          <th className="text-left p-3 font-semibold dark:text-gray-300">
                            Jenis
                          </th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">
                            Tanggal Mulai
                          </th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">
                            Tanggal Selesai
                          </th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">
                            Alasan
                          </th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">
                            Status
                          </th>
                          <th className="text-left p-3 font-semibold dark:text-gray-300">
                            Diajukan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionHistory.length > 0 ? (
                          submissionHistory.map((sub) => (
                            <tr
                              key={sub.id}
                              className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td className="p-3 dark:text-gray-300 font-medium">
                                {sub.type}
                              </td>
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">
                                {formatDate(sub.startDate)}
                              </td>
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">
                                {formatDate(sub.endDate)}
                              </td>
                              <td className="p-3 dark:text-gray-300 max-w-[200px] truncate">
                                {sub.reason || "-"}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusBadge(
                                    sub.status
                                  )}`}
                                >
                                  {getSubmissionStatusLabel(sub.status)}
                                </span>
                              </td>
                              <td className="p-3 dark:text-gray-300 whitespace-nowrap">
                                {formatDate(sub.createdAt)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-8 text-center text-gray-500 dark:text-gray-400"
                            >
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
