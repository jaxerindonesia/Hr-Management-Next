"use client";

import { Download, Edit, Filter, Plus, Trash2, Upload, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import type { DefaultColumnFormat } from "@/components/dynamic-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PartnerDto } from "@/lib/dto/finance-partner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HeaderToolbarProps {
  title: string;
  actions: {
    onAdd: () => void;
    addLabel: string;
    onExport: () => void;
    onImport: () => void;
    isExporting: boolean;
    checkRole: (module: string, action: string) => boolean;
  };
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    searchPlaceholder: string;
  };
}

interface RenderActionsProps {
  row: PartnerDto;
  checkRole: (module: string, action: string) => boolean;
  onView: (row: PartnerDto) => void;
  onDelete?: (id: string) => void;
  deleteId?: string | null;
  setDeleteId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ITEMS_PER_PAGE = 10;

export const columnFormats: DefaultColumnFormat<PartnerDto>[] = [
  {
    key: "code",
    title: "Kode",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "name",
    title: "Nama",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "phone",
    title: "Telepon",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "email",
    title: "Email",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "address",
    title: "Alamat",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
];

export function headerToolbar({ title, actions, filters }: HeaderToolbarProps) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions.checkRole("finance", "create") && (
          <Button onClick={actions.onAdd} className="flex w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
            <Plus className="h-4 w-4" />
            {actions.addLabel}
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

        {actions.checkRole("finance", "export") && (
          <Button
            onClick={actions.onExport}
            disabled={actions.isExporting}
            variant="outline"
            className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <Download className="h-4 w-4" />
            {actions.isExporting ? "Mengexport..." : "Export Excel"}
          </Button>
        )}

        {actions.checkRole("finance", "import") && (
          <Button
            variant="outline"
            onClick={actions.onImport}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-900/20 sm:w-auto"
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
              Filter Data {title}
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
                placeholder={filters.searchPlaceholder}
                className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const renderActions = ({
  row,
  checkRole,
  onView,
  onDelete,
  deleteId,
  setDeleteId,
}: RenderActionsProps) => (
  <div className="flex justify-end gap-2">
    {checkRole("finance", "update") && (
      <Button
        variant="ghost"
        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        onClick={() => row.id && onView && onView(row)}
      >
        <Edit className="w-4 h-4" />
      </Button>
    )}

    {checkRole("finance", "delete") && onDelete && (
      <Popover
        open={deleteId === row.id}
        onOpenChange={(open) => setDeleteId?.(open ? row.id : null)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-56 space-y-3">
          <p className="text-sm">Yakin ingin menghapus data ini?</p>

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
