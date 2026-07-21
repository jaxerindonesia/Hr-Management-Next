"use client";

import { Download, Edit, Filter, Plus, Trash2, X } from "lucide-react";
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
import type { PerformanceDto } from "@/lib/dto/performance";

const modelName = "performances";

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
    period: string;
    setPeriod: React.Dispatch<React.SetStateAction<string>>;
    score: string;
    setScore: React.Dispatch<React.SetStateAction<string>>;
  };
}

interface RenderActionsProps {
  row: PerformanceDto;
  checkRole: (module: string, action: string) => boolean;
  onView: (item: PerformanceDto) => void;
  onDelete?: (id: string) => void;
  deleteId?: string | null;
  setDeleteId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ITEMS_PER_PAGE = 10;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={
            index < rating
              ? "text-yellow-400 dark:text-yellow-300"
              : "text-gray-300 dark:text-gray-600"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function getRatingLabel(rating: number) {
  if (rating >= 5) return "Sangat Baik";
  if (rating >= 4) return "Baik";
  if (rating >= 3) return "Cukup";
  if (rating >= 2) return "Kurang Baik";
  return "Sangat Kurang";
}

function renderScoreCell(score: number) {
  return (
    <div className="space-y-1">
      <StarRating rating={score} />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {getRatingLabel(score)}
      </p>
    </div>
  );
}

export const columnFormats: DefaultColumnFormat<PerformanceDto>[] = [
  {
    key: "user",
    title: "Karyawan",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (_value, row) => row.user?.name || "-",
  },
  {
    key: "period",
    title: "Periode",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "productivity",
    title: "Produktivitas",
    textClassName: "whitespace-normal",
    formatter: (value) => renderScoreCell(Number(value || 0)),
  },
  {
    key: "quality",
    title: "Kualitas",
    textClassName: "whitespace-normal",
    formatter: (value) => renderScoreCell(Number(value || 0)),
  },
  {
    key: "teamwork",
    title: "Kerjasama",
    textClassName: "whitespace-normal",
    formatter: (value) => renderScoreCell(Number(value || 0)),
  },
  {
    key: "discipline",
    title: "Disiplin",
    textClassName: "whitespace-normal",
    formatter: (value) => renderScoreCell(Number(value || 0)),
  },
  {
    key: "totalScore",
    title: "Total Score",
    textClassName: "whitespace-normal",
    formatter: (value) => (
      <div className="flex flex-col">
        <span className="font-bold text-blue-600 dark:text-blue-400">
          {Number(value || 0)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getRatingLabel(Math.round(Number(value || 0)))}
        </span>
      </div>
    ),
  },
  {
    key: "notes",
    title: "Catatan",
    textClassName: "max-w-[260px] truncate text-slate-700 dark:text-slate-200",
    formatter: (value) => String(value || "-"),
  },
];

export const headerToolbar = ({ actions, filters }: HeaderToolbarProps) => (
  <div>
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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

      {actions.checkRole(modelName, "export") && (
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
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Filter Data Kinerja
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cari
            </Label>
            <Input
              type="text"
              value={filters.searchTerm}
              onChange={(event) => filters.setSearchTerm(event.target.value)}
              placeholder="Nama karyawan atau periode"
              className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Periode
            </Label>
            <Input
              type="text"
              value={filters.period === "all" ? "" : filters.period}
              onChange={(event) =>
                filters.setPeriod(event.target.value || "all")
              }
              placeholder="Contoh: Q1 2024"
              className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nilai Kinerja
            </Label>
            <Select value={filters.score} onValueChange={filters.setScore}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Nilai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Nilai</SelectItem>
                <SelectItem value="excellent">Sangat Baik (≥ 4.5)</SelectItem>
                <SelectItem value="good">Baik (3.5 - 4.49)</SelectItem>
                <SelectItem value="fair">Cukup (2.5 - 3.49)</SelectItem>
                <SelectItem value="poor">Kurang (&lt; 2.5)</SelectItem>
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
  onView,
  onDelete,
  deleteId,
  setDeleteId,
}: RenderActionsProps) => (
  <div className="flex justify-end gap-2">
    {checkRole(modelName, "update") && (
      <button
        onClick={() => onView(row)}
        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        title="Edit"
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
          <p className="text-sm">Yakin ingin menghapus penilaian ini?</p>

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
