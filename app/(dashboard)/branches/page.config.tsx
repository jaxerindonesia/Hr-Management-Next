"use client";

import type React from "react";
import { Edit, Filter, Plus, Trash2, X } from "lucide-react";
import type { DefaultColumnFormat } from "@/components/dynamic-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BranchDto } from "@/lib/dto/branch";

interface HeaderToolbarProps {
  actions: {
    onAdd: () => void;
    checkRole: (module: string, action: string) => boolean;
  };
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  };
}

interface RenderActionsProps {
  row: BranchDto;
  checkRole: (module: string, action: string) => boolean;
  onView: (row: BranchDto) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
  setDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
}

const modelName = "branches";
export const ITEMS_PER_PAGE = 10;

export const columnFormats: DefaultColumnFormat<BranchDto>[] = [
  { key: "name", title: "Nama Cabang", textClassName: "font-medium text-slate-900 dark:text-slate-100", formatter: (value) => String(value || "-") },
  { key: "code", title: "Kode", formatter: (value) => String(value || "-") },
  { key: "attendanceRadiusMeters", title: "Radius", formatter: (value) => `${Number(value || 0)} m` },
  { key: "officeStartTime", title: "Jam Kerja", formatter: (_value, row) => row.customWorkingHoursEnabled ? `${row.officeStartTime} - ${row.officeEndTime}` : "Mengikuti tenant" },
  {
    key: "locationLockEnabled",
    title: "Kunci Lokasi",
    formatter: (value) => (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${value
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      }`}>
        {value ? "Aktif" : "Nonaktif"}
      </span>
    ),
  },
  {
    key: "isActive",
    title: "Status",
    formatter: (value) => (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${value
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      }`}>
        {value ? "Aktif" : "Nonaktif"}
      </span>
    ),
  },
];

export function headerToolbar({ actions, filters }: HeaderToolbarProps) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions.checkRole(modelName, "create") && (
          <Button onClick={actions.onAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="outline"
          onClick={() => filters.setShow(!filters.show)}
          className={`relative flex items-center gap-2 ${filters.show || filters.activeCount > 0 ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : ""}`}
        >
          <Filter className="h-4 w-4" /> Filter
          {filters.activeCount > 0 && <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">{filters.activeCount}</span>}
        </Button>
      </div>

      {filters.show && (
        <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Filter Data Cabang</h3>
            {filters.activeCount > 0 && <Button type="button" variant="ghost" size="sm" onClick={filters.clear} className="text-blue-600 dark:text-blue-400"><X className="mr-1 h-4 w-4" />Hapus Filter</Button>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Cari</Label>
              <Input value={filters.searchTerm} onChange={(event) => filters.setSearchTerm(event.target.value)} placeholder="Nama atau kode cabang..." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function renderActions({ row, checkRole, onView, onDelete, deleteId, setDeleteId }: RenderActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      {checkRole(modelName, "update") && <Button variant="ghost" size="icon" onClick={() => onView(row)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit"><Edit className="h-4 w-4" /></Button>}
      {checkRole(modelName, "delete") && (
        <Popover open={deleteId === row.id} onOpenChange={(open) => setDeleteId(open ? row.id ?? null : null)}>
          <PopoverTrigger asChild><Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Hapus"><Trash2 className="h-4 w-4" /></Button></PopoverTrigger>
          <PopoverContent className="w-56 space-y-3">
            <p className="text-sm">Yakin ingin menghapus cabang ini?</p>
            <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Batal</Button><Button variant="destructive" size="sm" onClick={() => row.id && onDelete(row.id)}>Hapus</Button></div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
