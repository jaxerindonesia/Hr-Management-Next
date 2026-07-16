"use client";

import { Download, Edit, FileText, Filter, Plus, Printer, Settings, Trash2, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import type { DefaultColumnFormat } from "@/components/dynamic-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DepartmentDto } from "@/lib/dto/department";
import type { UserDto } from "@/lib/dto/user";
import { formatCurrency } from "@/lib/helper/format-currency";
import { formatDateId, formatTimeId } from "@/lib/helper/date";

const modelName = "users";

export type TenantOption = {
  id: string;
  companyName: string;
};

export type AttendanceDetail = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  notes: string | null;
  workHours: string | null;
};

export type SubmissionHistory = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
};

export type LeaveQuota = {
  configName: string;
  maxDays: number;
  usedDays: number;
  remainingDays: number;
};

export type RecapData = {
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

export type DepartmentOption = {
  id: string;
  name: string;
  tenantId?: string | null;
  tenant?: { id: string; companyName: string } | null;
} | null;

interface HeaderToolbarProps {
  actions: {
    onAdd: () => void;
    onExport: () => void;
    onBulkDownload: () => void;
    onOpenDepartment: () => void;
    checkRole: (module: string, action: string) => boolean;
    isExporting: boolean;
    isBulkDownloading: boolean;
    total: number;
  };
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    department: string;
    setDepartment: React.Dispatch<React.SetStateAction<string>>;
    status: string;
    setStatus: React.Dispatch<React.SetStateAction<string>>;
    company: string;
    setCompany: React.Dispatch<React.SetStateAction<string>>;
    departments: DepartmentDto[];
    tenants: TenantOption[];
    isSuperAdmin: boolean;
    getDepartmentDisplayName: (dept?: DepartmentOption) => string;
  };
}

interface ColumnFormatsProps {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  getDepartmentDisplayName: (dept?: DepartmentOption) => string;
}

interface RenderActionsProps {
  row: UserDto;
  checkRole: (module: string, action: string) => boolean;
  onViewRecap: (employee: UserDto) => void;
  onView: (employee: UserDto) => void;
  onDelete?: (id: string) => void;
  deleteId?: string | null;
  setDeleteId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ITEMS_PER_PAGE = 10;

export const columnFormats = ({
  isSuperAdmin,
  isAdmin,
  getDepartmentDisplayName,
}: ColumnFormatsProps): DefaultColumnFormat<UserDto>[] => {
  const columns: DefaultColumnFormat<UserDto>[] = [];

  if (isSuperAdmin) {
    columns.push({
      key: "tenant",
      title: "Perusahaan",
      textClassName: "font-medium text-slate-900 dark:text-slate-200",
      formatter: (_value, row) => row.tenant?.companyName || "-",
    });
  }

  columns.push(
    {
      key: "name",
      title: "Karyawan",
      textClassName: "font-medium text-slate-900 dark:text-slate-200",
      formatter: (value) => String(value || "-"),
    },
    {
      key: "nik",
      title: "NIK",
      textClassName: "font-medium text-slate-900 dark:text-slate-100",
      formatter: (value) => String(value || "-"),
    },
    {
      key: "email",
      title: "Email",
      textClassName: "font-medium text-slate-900 dark:text-slate-100",
      formatter: (value) => String(value || "-"),
    },
    {
      key: "role",
      title: "Role",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (_value, row) => row.role?.name || "-",
    },
    {
      key: "position",
      title: "Posisi",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (value) => String(value || "-"),
    },
    {
      key: "phone",
      title: "No. Telepon",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (value) => String(value || "-"),
    },
    {
      key: "gender",
      title: "Gender",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (value) =>
        value === "male" ? "Laki-laki" : value === "female" ? "Perempuan" : "-",
    },
    {
      key: "birthPlace",
      title: "Tempat Lahir",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (value) => String(value || "-"),
    },
    {
      key: "department",
      title: "Departemen",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (_value, row) => getDepartmentDisplayName(row.department),
    },
  );

  if (isSuperAdmin || isAdmin) {
    columns.push({
      key: "salary",
      title: "Gaji",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (value) => formatCurrency(Number(value || 0)),
    });
  }

  columns.push({
    key: "status",
    title: "Status",
    formatter: (_value, row) => (
      <span
        className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${row.status === "active"
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
          }`}
      >
        {row.status === "active" ? "Aktif" : "Tidak Aktif"}
      </span>
    ),
  });

  return columns;
};

export const headerToolbar = ({ actions, filters }: HeaderToolbarProps) => (
  <div>
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      {actions.checkRole("departments", "create") && (
        <Button
          onClick={actions.onOpenDepartment}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <Settings className="h-4 w-4" />
          Kelola Departemen
        </Button>
      )}

      {actions.checkRole(modelName, "create") && (
        <Button
          onClick={actions.onAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      )}

      <div className="flex-1" />

      <Button
        variant="outline"
        onClick={() => filters.setShow(!filters.show)}
        className={`relative flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${filters.show || filters.activeCount > 0
          ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          : "border-gray-300 text-slate-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
      >
        <Filter className="h-4 w-4" />
        Filter
        {filters.activeCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
            {filters.activeCount}
          </span>
        )}
      </Button>

      {actions.checkRole(modelName, "export") && (
        <>
          <Button
            onClick={actions.onBulkDownload}
            disabled={actions.isBulkDownloading || actions.total === 0}
            variant="outline"
            className="flex items-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <Printer className="h-4 w-4" />
            {actions.isBulkDownloading ? "Menyiapkan..." : "Download Semua PDF"}
          </Button>
          <Button
            onClick={actions.onExport}
            disabled={actions.isExporting}
            variant="outline"
            className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <Download className="h-4 w-4" />
            {actions.isExporting ? "Mengexport..." : "Export Excel"}
          </Button>
        </>
      )}
    </div>

    {filters.show && (
      <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Filter Data Karyawan
          </h3>
          {filters.activeCount > 0 && (
            <button
              onClick={filters.clear}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              <X className="h-4 w-4" />
              Hapus Semua Filter
            </button>
          )}
        </div>

        <div
          className={`grid grid-cols-1 gap-4 ${filters.isSuperAdmin ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
            }`}
        >
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cari
            </Label>
            <Input
              type="text"
              value={filters.searchTerm}
              onChange={(event) => filters.setSearchTerm(event.target.value)}
              placeholder="Nama, NIK, posisi..."
              className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {filters.isSuperAdmin && (
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Perusahaan
              </Label>
              <Select value={filters.company} onValueChange={filters.setCompany}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Perusahaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Perusahaan</SelectItem>
                  {filters.tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Departemen
            </Label>
            <Select value={filters.department} onValueChange={filters.setDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {filters.departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {filters.getDepartmentDisplayName(department)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </Label>
            <Select value={filters.status} onValueChange={filters.setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )}
  </div>
);

export const renderActions = ({
  row,
  checkRole,
  onViewRecap,
  onView,
  onDelete,
  deleteId,
  setDeleteId,
}: RenderActionsProps) => (
  <div className="flex justify-end gap-2">
    <button
      onClick={() => onViewRecap(row)}
      title="Rekap Karyawan"
      className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
    >
      <FileText className="h-4 w-4" />
    </button>

    {checkRole(modelName, "update") && (
      <button
        onClick={() => onView(row)}
        title="Edit"
        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <Edit className="h-4 w-4" />
      </button>
    )}

    {checkRole(modelName, "delete") && onDelete && (
      <Popover
        open={deleteId === row.id}
        onOpenChange={(open) => setDeleteId?.(open ? row.id ?? null : null)}
      >
        <PopoverTrigger asChild>
          <button className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-56 space-y-3">
          <p className="text-sm">Yakin ingin menghapus karyawan ini?</p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId?.(null)}>
              Batal
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => row.id && onDelete(row.id)}
            >
              Hapus
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )}
  </div>
);

export const MONTHS = [
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

export function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getSubmissionStatusLabel(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "APPROVED") return "Disetujui";
  if (s === "REJECTED") return "Ditolak";
  return "Pending";
}

export function buildEmployeeRecapSection(employee: UserDto, recap: RecapData) {
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
          <td>${escapeHtml(formatDateId(att.date))}</td>
          <td>${escapeHtml(formatTimeId(att.checkIn))}</td>
          <td>${escapeHtml(formatTimeId(att.checkOut))}</td>
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
          <td>${escapeHtml(formatDateId(sub.startDate))}</td>
          <td>${escapeHtml(formatDateId(sub.endDate))}</td>
          <td>${escapeHtml(sub.reason || "-")}</td>
          <td>${escapeHtml(getSubmissionStatusLabel(sub.status))}</td>
          <td>${escapeHtml(formatDateId(sub.createdAt))}</td>
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
            <div class="meta-item"><span class="label">Lahir</span><span class="value">${escapeHtml(employee.birthPlace ? `${employee.birthPlace}, ${formatDateId(employee.birthDate)}` : formatDateId(employee.birthDate))}</span></div>
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

export function buildBulkRecapHtml(
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
