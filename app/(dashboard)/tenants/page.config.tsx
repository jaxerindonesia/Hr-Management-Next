"use client";

import { Edit, Filter, Plus, Trash2, X } from "lucide-react";
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
import { formatDateId } from "@/lib/helper/date";

export type Tenant = {
  id: string;
  companyName: string;
  adminEmail: string;
  isActive: boolean;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
};

export type FormDataProps = {
  isOpen: boolean;
  initialData?: Tenant;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export type FormState = {
  companyName: string;
  adminEmail: string;
  isActive: boolean;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  subscriptionStart: string;
  subscriptionEnd: string;
};

export type TenantDto = {
  id: string;
  companyName: string;
  adminEmail: string;
  isActive: boolean;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  createdAt: string;
};

interface HeaderToolbarProps {
  actions: {
    onAdd: () => void;
  };
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    status: string;
    setStatus: React.Dispatch<React.SetStateAction<string>>;
  };
}

interface RenderActionsProps {
  row: TenantDto;
  onView: (tenant: TenantDto) => void;
  onDelete?: (id: string) => void;
  deleteId?: string | null;
  setDeleteId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ITEMS_PER_PAGE = 10;

export const columnFormats: DefaultColumnFormat<TenantDto>[] = [
  {
    key: "companyName",
    title: "Nama Perusahaan",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "adminEmail",
    title: "Email Admin",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "isActive",
    title: "Status",
    formatter: (value) => (
      <span
        className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
          value
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {value ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "subscriptionStart",
    title: "Mulai Langganan",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => formatDateId(typeof value === "string" ? value : null),
  },
  {
    key: "subscriptionEnd",
    title: "Akhir Langganan",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => formatDateId(typeof value === "string" ? value : null),
  },
];

export const headerToolbar = ({ actions, filters }: HeaderToolbarProps) => (
  <div>
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button
        onClick={actions.onAdd}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Tambah Tenant
      </Button>

      <div className="flex-1" />

      <Button
        variant="outline"
        onClick={() => filters.setShow(!filters.show)}
        className={`relative flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
          filters.show || filters.activeCount > 0
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
    </div>

    {filters.show && (
      <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Filter Data Tenant
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cari
            </Label>
            <Input
              type="text"
              value={filters.searchTerm}
              onChange={(event) => filters.setSearchTerm(event.target.value)}
              placeholder="Cari company / email..."
              className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
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
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
  onView,
  onDelete,
  deleteId,
  setDeleteId,
}: RenderActionsProps) => (
  <div className="flex justify-end gap-2">
    <button
      onClick={() => onView(row)}
      title="Edit"
      className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
    >
      <Edit className="h-4 w-4" />
    </button>

    {onDelete && (
      <Popover
        open={deleteId === row.id}
        onOpenChange={(open) => setDeleteId?.(open ? row.id : null)}
      >
        <PopoverTrigger asChild>
          <button className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-56 space-y-3">
          <p className="text-sm">Yakin ingin menghapus tenant ini?</p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId?.(null)}>
              Batal
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(row.id)}
            >
              Hapus
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )}
  </div>
);
