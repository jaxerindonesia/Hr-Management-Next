"use client";

import { Download, Edit, Eye, Filter, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import type { DefaultColumnFormat } from "@/components/dynamic-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/helper/format-currency";
import type { JournalDetailDto, JournalDto } from "@/lib/dto/finance-journal";

interface HeaderToolbarProps {
  actions: {
    onAdd: () => void;
    onExport: () => void;
    checkRole: (module: string, action: string) => boolean;
    isExporting: boolean;
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
  row: JournalDto;
  checkRole: (module: string, action: string) => boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
  setDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ITEMS_PER_PAGE = 10;

function formatJournalDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getJournalNominal(details: JournalDetailDto[]) {
  return details.reduce((sum, item) => sum + Number(item.debit || 0), 0);
}

export const columnFormats: DefaultColumnFormat<JournalDto>[] = [
  {
    key: "journalNo",
    title: "No Jurnal",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "date",
    title: "Tanggal",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => (value ? formatJournalDate(String(value)) : "-"),
  },
  {
    key: "referenceNo",
    title: "Referensi",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "description",
    title: "Deskripsi",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "details",
    title: "Nominal",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (value) => formatCurrency(getJournalNominal((value as JournalDetailDto[]) || [])),
  },
  {
    key: "status",
    title: "Status",
    formatter: (value) => (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${value === "POSTED"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : value === "VOID"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
      >
        {String(value || "-")}
      </span>
    ),
  },
];

export function headerToolbar({ actions, filters }: HeaderToolbarProps) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions.checkRole("finance", "create") && (
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
      </div>

      {filters.show && (
        <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Filter Data Jurnal Umum</h3>
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
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cari</Label>
              <Input
                type="text"
                value={filters.searchTerm}
                onChange={(event) => filters.setSearchTerm(event.target.value)}
                placeholder="Cari no jurnal, referensi, atau deskripsi..."
                className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
              <Select value={filters.status} onValueChange={filters.setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">DRAFT</SelectItem>
                  <SelectItem value="posted">POSTED</SelectItem>
                  <SelectItem value="void">VOID</SelectItem>
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
  onView,
  onEdit,
  onDelete,
  deleteId,
  setDeleteId,
}: RenderActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      {checkRole("finance", "get-by-id") && (
        <Button
          variant="ghost"
          onClick={() => onView(row.id)}
          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Detail"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {checkRole("finance", "update") && (
        <Button
          variant="ghost"
          onClick={() => onEdit(row.id)}
          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}

      {checkRole("finance", "delete") && (
        <Popover
          open={deleteId === row.id}
          onOpenChange={(open) => setDeleteId(open ? row.id : null)}
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
            <p className="text-sm">Yakin ingin menghapus jurnal ini?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
                Batal
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(row.id)}>
                Hapus
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
