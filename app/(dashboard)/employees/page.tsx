"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Settings,
  Download,
  Search,
  FileText,
  Printer,
} from "lucide-react";
import { UserDto } from "@/lib/dto/user";
import { formatCurrency } from "@/lib/helper/format-currency";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import FormData from "./components/form-data";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/lib/helper/check-role";
import ModalDepartment from "./components/modal-department";
import ModalRecap from "./components/modal-recap";
import { DepartmentDto } from "@/lib/dto/department";
import { Input } from "@/components/ui/input";

type TenantOption = {
  id: string;
  companyName: string;
};

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

function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrintDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrintTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSubmissionStatusLabel(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "APPROVED") return "Disetujui";
  if (s === "REJECTED") return "Ditolak";
  return "Pending";
}

function buildEmployeeRecapSection(employee: UserDto, recap: RecapData) {
  const summary = recap.attendance.summary;
  const gender =
    employee.gender === "male"
      ? "Laki-laki"
      : employee.gender === "female"
        ? "Perempuan"
        : "-";

  const attendanceRows = recap.attendance.details
    .map(
      (att) => `
        <tr>
          <td>${escapeHtml(formatPrintDate(att.date))}</td>
          <td>${escapeHtml(formatPrintTime(att.checkIn))}</td>
          <td>${escapeHtml(formatPrintTime(att.checkOut))}</td>
          <td>${escapeHtml(att.status || "-")}</td>
          <td>${escapeHtml(att.workHours || "-")}</td>
          <td>${escapeHtml(att.notes || "-")}</td>
        </tr>
      `,
    )
    .join("");

  const quotaCards = recap.submissions.leaveQuotas
    .map(
      (quota) => `
        <div class="quota-card">
          <p class="quota-title">${escapeHtml(quota.configName)}</p>
          <p class="quota-value">${escapeHtml(quota.remainingDays)} <span>/ ${escapeHtml(quota.maxDays)} hari</span></p>
          <p class="quota-used">Terpakai: ${escapeHtml(quota.usedDays)} hari</p>
        </div>
      `,
    )
    .join("");

  const submissionRows = recap.submissions.history
    .map(
      (sub) => `
        <tr>
          <td>${escapeHtml(sub.type)}</td>
          <td>${escapeHtml(formatPrintDate(sub.startDate))}</td>
          <td>${escapeHtml(formatPrintDate(sub.endDate))}</td>
          <td>${escapeHtml(sub.reason || "-")}</td>
          <td>${escapeHtml(getSubmissionStatusLabel(sub.status))}</td>
          <td>${escapeHtml(formatPrintDate(sub.createdAt))}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="employee-page">
      <div class="profile">
        <div>
          <h1>${escapeHtml(employee.name)}</h1>
          <div class="subtitle">${escapeHtml(employee.position || "-")} &bull; ${escapeHtml(employee.department?.name || "-")}</div>
          <div class="meta">
            <div class="meta-item"><span class="label">NIK</span><span class="value">${escapeHtml(employee.nik || "-")}</span></div>
            <div class="meta-item"><span class="label">Gender</span><span class="value">${escapeHtml(gender)}</span></div>
            <div class="meta-item"><span class="label">Email</span><span class="value">${escapeHtml(employee.email || "-")}</span></div>
            <div class="meta-item"><span class="label">Lahir</span><span class="value">${escapeHtml(employee.birthPlace ? `${employee.birthPlace}, ${formatPrintDate(employee.birthDate)}` : formatPrintDate(employee.birthDate))}</span></div>
            <div class="meta-item wide"><span class="label">Alamat</span><span class="value">${escapeHtml(employee.address || "-")}</span></div>
          </div>
        </div>
      </div>

      <h2>Rekap Kehadiran - ${escapeHtml(MONTHS[recap.month - 1])} ${escapeHtml(recap.year)}</h2>
      <div class="summary-cards">
        <div class="summary-card green"><span>Hadir</span><strong>${escapeHtml(summary.totalHadir || 0)}</strong></div>
        <div class="summary-card yellow"><span>Telat</span><strong>${escapeHtml(summary.totalTelat || 0)}</strong></div>
        <div class="summary-card red"><span>Alpha</span><strong>${escapeHtml(summary.totalAlpha || 0)}</strong></div>
        <div class="summary-card blue"><span>Izin/Cuti</span><strong>${escapeHtml(summary.totalIzin || 0)}</strong></div>
      </div>

      <table>
        <thead>
          <tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Status</th><th>Jam Kerja</th><th>Catatan</th></tr>
        </thead>
        <tbody>
          ${attendanceRows || '<tr><td colspan="6" class="empty">Tidak ada data kehadiran</td></tr>'}
        </tbody>
      </table>

      <h2>Pengajuan Ketidakhadiran - Tahun ${escapeHtml(recap.year)}</h2>
      ${quotaCards ? `<div class="quota-cards">${quotaCards}</div>` : '<p class="empty-block">Tidak ada kuota cuti.</p>'}
      <table>
        <thead>
          <tr><th>Jenis</th><th>Mulai</th><th>Selesai</th><th>Alasan</th><th>Status</th><th>Diajukan</th></tr>
        </thead>
        <tbody>
          ${submissionRows || '<tr><td colspan="6" class="empty">Tidak ada pengajuan</td></tr>'}
        </tbody>
      </table>
    </section>
  `;
}

function buildBulkRecapHtml(
  rows: { employee: UserDto; recap: RecapData }[],
  month: number,
  year: number,
) {
  return `
    <div id="bulk-recap-print-container">
      <style>
        #bulk-recap-print-container {
          font-family: Arial, sans-serif;
          color: #111827;
          padding: 24px;
          font-size: 12px;
          background: #fff;
        }
        #bulk-recap-print-container .document-title {
          margin: 0 0 18px;
          padding-bottom: 10px;
          border-bottom: 3px solid #2563eb;
        }
        #bulk-recap-print-container .document-title h1 {
          margin: 0 0 4px;
          font-size: 24px;
        }
        #bulk-recap-print-container .document-title p { margin: 0; color: #4b5563; }
        #bulk-recap-print-container .employee-page {
          break-after: page;
          page-break-after: always;
          padding-bottom: 16px;
        }
        #bulk-recap-print-container .employee-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }
        #bulk-recap-print-container .profile {
          padding: 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }
        #bulk-recap-print-container h1 { font-size: 22px; margin: 0 0 6px; }
        #bulk-recap-print-container h2 {
          font-size: 15px;
          margin: 20px 0 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #2563eb;
          color: #1e40af;
        }
        #bulk-recap-print-container .subtitle { color:#2563eb; font-weight:700; }
        #bulk-recap-print-container .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 24px;
          margin-top: 12px;
        }
        #bulk-recap-print-container .meta-item { display:flex; flex-direction:column; gap:2px; }
        #bulk-recap-print-container .meta-item.wide { grid-column: 1 / -1; }
        #bulk-recap-print-container .label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #6b7280;
        }
        #bulk-recap-print-container .value { font-weight: 600; }
        #bulk-recap-print-container .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        #bulk-recap-print-container .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px;
        }
        #bulk-recap-print-container .summary-card span { display:block; font-weight:700; margin-bottom:5px; }
        #bulk-recap-print-container .summary-card strong { font-size: 24px; }
        #bulk-recap-print-container .green { background:#f0fdf4; color:#15803d; }
        #bulk-recap-print-container .yellow { background:#fefce8; color:#a16207; }
        #bulk-recap-print-container .red { background:#fef2f2; color:#b91c1c; }
        #bulk-recap-print-container .blue { background:#eff6ff; color:#1d4ed8; }
        #bulk-recap-print-container table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        #bulk-recap-print-container th {
          background: #f3f4f6;
          text-align: left;
          padding: 8px;
          border-bottom: 2px solid #d1d5db;
        }
        #bulk-recap-print-container td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        #bulk-recap-print-container .quota-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 10px;
        }
        #bulk-recap-print-container .quota-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px;
        }
        #bulk-recap-print-container .quota-title { margin:0 0 4px; font-weight:700; }
        #bulk-recap-print-container .quota-value { margin:0; color:#2563eb; font-size:20px; font-weight:700; }
        #bulk-recap-print-container .quota-value span { color:#6b7280; font-size:12px; font-weight:500; }
        #bulk-recap-print-container .quota-used { margin:4px 0 0; color:#6b7280; font-size:11px; }
        #bulk-recap-print-container .empty,
        #bulk-recap-print-container .empty-block {
          text-align:center;
          color:#6b7280;
          padding:14px;
        }
        @page { margin: 15mm; size: A4; }
      </style>
      <div class="document-title">
        <h1>Rekap Karyawan</h1>
        <p>${escapeHtml(MONTHS[month - 1])} ${escapeHtml(year)} &bull; ${escapeHtml(rows.length)} karyawan</p>
      </div>
      ${rows.map(({ employee, recap }) => buildEmployeeRecapSection(employee, recap)).join("")}
    </div>
  `;
}

export default function EmployeesPage() {
  const { checkRole, checkRoleMulti } = usePermission();
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [recapEmployee, setRecapEmployee] = useState<UserDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [formData, setFormData] = useState<UserDto>({
    roleId: "",
    departmentId: "",
    nik: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    joinDate: "",
    salary: 0,
    password: "",
    status: "active",
  });

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  const isSuperAdmin = userData.role === "Super Admin";
  const isAdmin = userData.role === "Admin";

  const getDepartmentDisplayName = (dept?: DepartmentDto | null) => {
    if (!dept) return "-";
    if (!isSuperAdmin) return dept.name || "-";
    const companyName = dept.tenant?.companyName || "";
    return companyName ? `${dept.name} - ${companyName}` : dept.name || "-";
  };

  const handleOpenModal = (data?: UserDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      roleId: "",
      departmentId: "",
      department: null,
      nik: "",
      name: "",
      email: "",
      phone: "",
      position: "",
      joinDate: "",
      salary: 0,
      password: "",
      status: "active",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus karyawan");
      toast.success("Karyawan berhasil dihapus!");
      fetchUsers();
    } catch {
      toast.error("Gagal menghapus karyawan");
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      params.set("limit", "999999");
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterDepartment !== "all")
        params.set("departmentId", filterDepartment);
      if (isSuperAdmin && filterCompany !== "all") {
        params.set("tenantId", filterCompany);
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");

      const json = await res.json();
      const allData: UserDto[] = json.data || [];

      const XLSX = await import("xlsx");

      const rows = allData.map((emp) => {
        const row: Record<string, unknown> = {
          NIK: emp.nik || "-",
          Nama: emp.name || "-",
          Email: emp.email || "-",
          "No. Telepon": emp.phone || "-",
          Posisi: emp.position || "-",
          Departemen:
            emp.department?.name && isSuperAdmin
              ? `${emp.department.name} - ${emp.tenant?.companyName || "-"}`
              : emp.department?.name || "-",
          "Tanggal Bergabung": emp.joinDate
            ? new Date(emp.joinDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            : "-",
          Status: emp.status === "active" ? "Aktif" : "Tidak Aktif",
        };

        if (isSuperAdmin) {
          row["Perusahaan"] = emp.tenant?.companyName || "-";
          row["Gaji"] = emp.salary || 0;
        }

        if (isAdmin) {
          row["Gaji"] = emp.salary || 0;
        }

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Karyawan");

      // Auto column width
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      // Format salary column as currency if Super Admin
      if (isSuperAdmin) {
        const salaryColIndex = Object.keys(rows[0] ?? {}).indexOf("Gaji");
        if (salaryColIndex >= 0) {
          const colLetter = XLSX.utils.encode_col(salaryColIndex);
          for (let i = 2; i <= rows.length + 1; i++) {
            const cellRef = `${colLetter}${i}`;
            if (worksheet[cellRef]) {
              worksheet[cellRef].z = "#,##0";
            }
          }
        }
      }

      const fileName = `data-karyawan-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Berhasil mengexport ${allData.length} data karyawan`);
    } catch {
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkRecapDownload = async () => {
    try {
      setIsBulkDownloading(true);

      const params = new URLSearchParams();
      params.set("limit", "999999");
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterDepartment !== "all")
        params.set("departmentId", filterDepartment);
      if (isSuperAdmin && filterCompany !== "all") {
        params.set("tenantId", filterCompany);
      }

      const usersRes = await fetch(`/api/users?${params.toString()}`);
      if (!usersRes.ok) throw new Error("Gagal mengambil data karyawan");

      const usersJson = await usersRes.json();
      const allData: UserDto[] = usersJson.data || [];
      if (allData.length === 0) {
        toast.error("Tidak ada data karyawan untuk didownload");
        return;
      }

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const recapResults = await Promise.all(
        allData.map(async (employee) => {
          if (!employee.id) return null;
          const recapRes = await fetch(
            `/api/users/${employee.id}/recap?month=${month}&year=${year}`,
          );
          if (!recapRes.ok) return null;
          const recapJson = await recapRes.json();
          return {
            employee,
            recap: recapJson.data as RecapData,
          };
        }),
      );

      const printableRows = recapResults.filter(
        (row): row is { employee: UserDto; recap: RecapData } => Boolean(row),
      );

      if (printableRows.length === 0) {
        toast.error("Gagal mengambil data rekap karyawan");
        return;
      }

      const printDiv = document.createElement("div");
      printDiv.id = "temp-bulk-recap-print-area";
      printDiv.innerHTML = buildBulkRecapHtml(printableRows, month, year);
      document.body.appendChild(printDiv);

      const style = document.createElement("style");
      style.id = "temp-bulk-recap-print-style";
      style.innerHTML = `
        @media print {
          body > *:not(#temp-bulk-recap-print-area) { display: none !important; }
          #temp-bulk-recap-print-area {
            display: block !important;
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
          }
          #temp-bulk-recap-print-area * { visibility: visible !important; }
          body, html { height: auto !important; overflow: visible !important; background: white !important; }
          @page { margin: 15mm; size: A4; }
        }
      `;
      document.head.appendChild(style);

      const oldTitle = document.title;
      document.title = `rekap-karyawan-${year}-${String(month).padStart(2, "0")}`;

      const cleanup = () => {
        if (document.body.contains(printDiv)) document.body.removeChild(printDiv);
        if (document.head.contains(style)) document.head.removeChild(style);
        document.title = oldTitle;
        window.removeEventListener("afterprint", cleanup);
      };

      window.addEventListener("afterprint", cleanup);
      setTimeout(() => window.print(), 250);
      setTimeout(cleanup, 60000);

      const failedCount = allData.length - printableRows.length;
      toast.success(
        failedCount > 0
          ? `Menyiapkan ${printableRows.length} rekap. ${failedCount} gagal dimuat.`
          : `Menyiapkan ${printableRows.length} rekap karyawan`,
      );
    } catch {
      toast.error("Gagal menyiapkan download bulk");
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const clearAllFilters = () => {
    setFilterDepartment("all");
    setFilterStatus("all");
    setFilterCompany("all");
    setSearchTerm("");
  };

  // Count active filters
  const activeFilterCount = [
    isSuperAdmin && filterCompany !== "all",
    filterDepartment !== "all",
    filterStatus !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  const filteredDepartments =
    isSuperAdmin && filterCompany !== "all"
      ? departments.filter((dept) => dept.tenantId === filterCompany)
      : departments;

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(itemsPerPage));
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterDepartment !== "all")
        params.set("departmentId", filterDepartment);
      if (isSuperAdmin && filterCompany !== "all") {
        params.set("tenantId", filterCompany);
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      const json = await res.json();
      setEmployees(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast.error("Gagal memuat data karyawan");
    }
  }, [currentPage, searchTerm, filterStatus, filterDepartment, filterCompany, isSuperAdmin]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Gagal mengambil data departemen");
      const json = await res.json();
      setDepartments(json.data || []);
    } catch {
      toast.error("Gagal memuat departemen");
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants?page=1&limit=100");
      if (!res.ok) throw new Error("Gagal mengambil data tenant");
      const json = await res.json();
      setTenants(json.data || []);
    } catch {
      toast.error("Gagal memuat data tenant");
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterStatus]);

  // Fetch data when page or filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchTenants();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (filterDepartment === "all") return;
    const exists = filteredDepartments.some((dept) => dept.id === filterDepartment);
    if (!exists) {
      setFilterDepartment("all");
    }
  }, [filterDepartment, filteredDepartments]);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {checkRole("departments", "create") && (
              <Button
                onClick={() => setShowDepartmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings className="w-4 h-4" /> Kelola Departemen
              </Button>
            )}

            {checkRole("users", "create") && (
              <>
                <Button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </Button>

                <div className="flex-1"></div>
              </>
            )}

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama, NIK, posisi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`relative flex items-center gap-2 px-4 py-2 ${showFilterPanel
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Export Button */}
            {checkRole("users", "export") && (
              <>
                <Button
                  onClick={handleBulkRecapDownload}
                  disabled={isBulkDownloading || total === 0}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Printer className="w-4 h-4" />
                  {isBulkDownloading ? "Menyiapkan..." : "Download Semua PDF"}
                </Button>

                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="outline"
                  className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Mengexport..." : "Export Excel"}
                </Button>
              </>
            )}
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Filter Data Karyawan
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Hapus Semua Filter
                  </button>
                )}
              </div>

              <div className={`grid grid-cols-1 ${isSuperAdmin ? "sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-3"} gap-4`}>
                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Perusahaan
                    </label>
                    <select
                      value={filterCompany}
                      onChange={(e) => setFilterCompany(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Semua Perusahaan</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Departemen
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Departemen</option>
                    {filteredDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {getDepartmentDisplayName(dept)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Pencarian: {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterDepartment !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Departemen:{" "}
                      {getDepartmentDisplayName(
                        filteredDepartments.find((d) => d.id === filterDepartment) ||
                        departments.find((d) => d.id === filterDepartment) ||
                        null,
                      )}
                      <button
                        onClick={() => setFilterDepartment("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {isSuperAdmin && filterCompany !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Perusahaan:{" "}
                      {tenants.find((t) => t.id === filterCompany)?.companyName || "-"}
                      <button
                        onClick={() => setFilterCompany("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Status:{" "}
                      {filterStatus === "active" ? "Aktif" : "Tidak Aktif"}
                      <button
                        onClick={() => setFilterStatus("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {isSuperAdmin && (
                    <th className="text-left p-3 font-semibold dark:text-gray-300">
                      Perusahaan
                    </th>
                  )}
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Email
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    NIK
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Nama
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Posisi
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    No. Telepon
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Gender
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Tempat Lahir
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Departemen
                  </th>
                  {(isSuperAdmin || isAdmin) && (
                    <th className="text-left p-3 font-semibold dark:text-gray-300">
                      Gaji
                    </th>
                  )}
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Status
                  </th>
                  {checkRoleMulti("users", ["update", "delete"]) && (
                    <th className="text-right p-3 font-semibold dark:text-gray-300">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {isSuperAdmin && (
                        <td className="p-3 dark:text-gray-300">
                          {emp.tenant?.companyName || "-"}
                        </td>
                      )}
                      <td className="p-3 font-medium dark:text-white">
                        {emp.email || "-"}
                      </td>
                      <td className="p-3 font-medium dark:text-white">
                        {emp.nik || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.name || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.position || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.phone || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.gender === "male"
                          ? "Laki-laki"
                          : emp.gender === "female"
                            ? "Perempuan"
                            : "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.birthPlace || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.department?.name && isSuperAdmin
                          ? `${emp.department.name} - ${emp.tenant?.companyName || "-"}`
                          : emp.department?.name || "-"}
                      </td>
                      {(isSuperAdmin || isAdmin) && (
                        <td className="p-3 dark:text-gray-300">
                          {formatCurrency(emp.salary || 0)}
                        </td>
                      )}
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                        >
                          {emp.status === "active" ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setRecapEmployee(emp)}
                            title="Rekap Karyawan"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {checkRole("users", "update") && (
                            <button
                              onClick={() => handleOpenModal(emp)}
                              title="Edit"
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {checkRole("users", "delete") && (
                            <Popover
                              open={openPopoverId === emp.id}
                              onOpenChange={(isOpen) =>
                                setOpenPopoverId(isOpen ? emp.id! : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus karyawan ini?
                                </p>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenPopoverId(null)}
                                  >
                                    Batal
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(emp.id!)}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={
                        (isSuperAdmin ? 1 : 0) +
                        8 + // email, nik, nama, posisi, no.telp, gender, tempat lahir, departemen
                        ((isSuperAdmin || isAdmin) ? 1 : 0) + // gaji
                        1 + // status
                        (checkRoleMulti("users", ["update", "delete"]) ? 1 : 0) // aksi
                      }
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Tidak ada data karyawan yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {employees.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {total}
              </span>{" "}
              karyawan
              {totalPages > 0 && (
                <span>
                  {" "}
                  — Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | "...")[] = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else if (currentPage <= 3) {
                      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
                    }
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm select-none">...</span>
                      ) : (
                        <button key={page} onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                          {page}
                        </button>
                      )
                    );
                  })()}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <FormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchUsers}
        />
      )}

      {/* Department Management Modal */}
      {showDepartmentModal && (
        <ModalDepartment onClose={() => setShowDepartmentModal(false)} />
      )}

      {/* Recap Modal */}
      {recapEmployee && (
        <ModalRecap
          employee={recapEmployee}
          onClose={() => setRecapEmployee(null)}
        />
      )}
    </>
  );
}
