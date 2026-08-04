"use client";

import { Download, Edit, FileText, Filter, Plus, Printer, Settings, Trash2, Upload, X } from "lucide-react";
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
import type { BranchDto } from "@/lib/dto/branch";
import type { UserDto } from "@/lib/dto/user";
import { formatCurrency } from "@/lib/helper/format-currency";

const modelName = "users";

export type TenantOption = {
  id: string;
  companyName: string;
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
    onImport: () => void;
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
    branch: string;
    setBranch: React.Dispatch<React.SetStateAction<string>>;
    status: string;
    setStatus: React.Dispatch<React.SetStateAction<string>>;
    company: string;
    setCompany: React.Dispatch<React.SetStateAction<string>>;
    departments: DepartmentDto[];
    branches: BranchDto[];
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
    {
      key: "branch",
      title: "Cabang",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (_value, row) => row.branch?.name || "-",
    },
  );

  if (isSuperAdmin || isAdmin) {
    columns.push({
      key: "salary",
      title: "Gaji",
      textClassName: "text-slate-700 dark:text-slate-200",
      formatter: (_value, row) => (
        <span>{formatCurrency(Number(row.salary || 0))} / {row.salaryType == "monthly" ? 'bulan' : 'hari'}</span>
      ),
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

      {actions.checkRole(modelName, "import") && (
        <Button
          variant="outline"
          onClick={actions.onImport}
          className="flex items-center gap-2 border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-900/20"
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
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
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${filters.isSuperAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"
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

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cabang
            </Label>
            <Select value={filters.branch} onValueChange={filters.setBranch}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {filters.branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id || ""}>
                    {filters.isSuperAdmin && branch.tenant?.companyName
                      ? `${branch.name} - ${branch.tenant.companyName}`
                      : branch.name}
                  </SelectItem>
                ))}
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
