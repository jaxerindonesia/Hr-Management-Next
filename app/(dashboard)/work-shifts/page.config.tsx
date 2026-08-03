"use client";

import type React from "react";
import { Edit, Filter, Plus, Trash2, X } from "lucide-react";
import type { DefaultColumnFormat } from "@/components/dynamic-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BranchDto } from "@/lib/dto/branch";
import type { WorkShiftDto } from "@/lib/dto/work-shift";

export const ITEMS_PER_PAGE = 10;

export const columnFormats: DefaultColumnFormat<WorkShiftDto>[] = [
  {
    key: "name",
    title: "Nama Shift",
    textClassName: "font-semibold text-slate-900 dark:text-slate-100",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "branchId",
    title: "Cabang",
    formatter: (_value, row) => row.branch?.name || "-",
  },
  {
    key: "startTime",
    title: "Jam Kerja",
    formatter: (_value, row) => `${row.startTime} - ${row.endTime}${row.crossesMidnight ? " (+1 hari)" : ""}`,
  },
  {
    key: "lateToleranceMinutes",
    title: "Toleransi",
    formatter: (value) => (value === null ? "Ikuti tenant" : `${value} menit`),
  },
  {
    key: "isActive",
    title: "Status",
    formatter: (value) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          value
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {value ? "Aktif" : "Nonaktif"}
      </span>
    ),
  },
];

export function headerToolbar({
  actions,
  filters,
}: {
  actions: { onAdd: () => void; checkRole: (model: string, action: string) => boolean };
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    branchId: string;
    setBranchId: React.Dispatch<React.SetStateAction<string>>;
    branches: BranchDto[];
  };
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions.checkRole("work-shifts", "create") && (
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
            <h3 className="font-semibold text-slate-900 dark:text-white">Filter Data Shift</h3>
            {filters.activeCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={filters.clear}
                className="text-blue-600 dark:text-blue-400"
              >
                <X className="mr-1 h-4 w-4" />
                Hapus Semua Filter
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cari</Label>
              <Input
                value={filters.searchTerm}
                onChange={(event) => filters.setSearchTerm(event.target.value)}
                placeholder="Nama atau kode shift..."
                className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cabang</Label>
              <Select
                value={filters.branchId || "all"}
                onValueChange={(value) => filters.setBranchId(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {filters.branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id || ""}>
                      {branch.name}
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
}

export function renderActions({
  row,
  checkRole,
  onEdit,
  onDelete,
  deleteId,
  setDeleteId,
}: {
  row: WorkShiftDto;
  checkRole: (model: string, action: string) => boolean;
  onEdit: (row: WorkShiftDto) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
  setDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <div className="flex justify-end gap-2">
      {checkRole("work-shifts", "update") && (
        <Button
          variant="ghost"
          size="icon"
          title="Edit"
          onClick={() => onEdit(row)}
          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {checkRole("work-shifts", "delete") && (
        <Popover
          open={deleteId === row.id}
          onOpenChange={(open) => setDeleteId(open ? row.id || null : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-3">
            <p className="text-sm">Yakin ingin menghapus shift ini?</p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                Batal
              </Button>
              <Button size="sm" variant="destructive" onClick={() => row.id && onDelete(row.id)}>
                Hapus
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}