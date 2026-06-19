"use client";

import { Filter, Plus, Search, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OvertimeToolbarProps = {
  isAdmin: boolean;
  userId: string;
  requestLoading: boolean;
  searchQuery: string;
  filterStatus: string;
  activeFilterCount: number;
  onOpenRequest: () => void;
  onOpenConfig: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleFilter: () => void;
};

export function OvertimeToolbar({
  isAdmin,
  userId,
  requestLoading,
  searchQuery,
  filterStatus,
  activeFilterCount,
  onOpenRequest,
  onOpenConfig,
  onSearchChange,
  onClearSearch,
  onToggleFilter,
}: OvertimeToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      {!isAdmin && userId && (
        <Button
          onClick={onOpenRequest}
          disabled={requestLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </Button>
      )}

      {isAdmin && (
        <Button
          onClick={onOpenConfig}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Konfigurasi Tarif Lembur
        </Button>
      )}

      <div className="flex-1" />

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari overtime..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        onClick={onToggleFilter}
        className={`relative flex items-center gap-2 px-4 py-2 ${
          filterStatus !== "all"
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
    </div>
  );
}
