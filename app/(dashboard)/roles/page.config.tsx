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
import type { RoleDto } from "@/lib/dto/role";

const modelName = "roles";

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
  row: RoleDto;
  checkRole: (module: string, action: string) => boolean;
  onView: (role: RoleDto) => void;
  onDelete?: (id: string) => void;
  deleteId?: string | null;
  setDeleteId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ITEMS_PER_PAGE = 10;

export function renderPermissions(permission: RoleDto["permission"]) {
  if (Array.isArray(permission)) {
    const grouped: Record<string, string[]> = {};

    for (const item of permission) {
      const model = String(item?.model ?? "");
      const action = String(item?.action ?? "");
      if (!model || !action) continue;
      if (!grouped[model]) grouped[model] = [];
      grouped[model].push(action);
    }

    return (
      <div className="space-y-2">
        {Object.entries(grouped).map(([model, actions]) => (
          <div key={model} className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700/40 dark:text-gray-200">
              {model}
            </span>
            {actions.map((action) => (
              <span
                key={`${model}-${action}`}
                className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {action}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (permission && typeof permission === "object") {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(permission).map(([model, value]) => {
          if (value && typeof value === "object" && "read" in value) {
            return (
              <span
                key={model}
                className="rounded-md bg-green-50 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300"
              >
                {model}: {(value as { read?: boolean }).read ? "read" : ""}
                {(value as { write?: boolean }).write ? "/write" : ""}
              </span>
            );
          }

          return (
            <span
              key={model}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700/40 dark:text-gray-300"
            >
              {model}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <span className="text-sm text-gray-600 dark:text-gray-400">
      {JSON.stringify(permission ?? {})}
    </span>
  );
}

export const columnFormats: DefaultColumnFormat<RoleDto>[] = [
  {
    key: "name",
    title: "Nama Role",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "permission",
    title: "Permissions",
    textClassName: "min-w-[320px] whitespace-normal",
    formatter: (value) => renderPermissions(value),
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
    </div>

    {filters.show && (
      <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Filter Data Role
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
              placeholder="Nama role..."
              className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
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
      <Button
        onClick={() => onView(row)}
        variant="ghost"
        size="icon"
        title="Edit"
        className="h-9 w-9 rounded-lg p-0 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
      >
        <Edit className="h-4 w-4" />
      </Button>
    )}

    {checkRole(modelName, "delete") && onDelete && (
      <Popover
        open={deleteId === row.id}
        onOpenChange={(open) => setDeleteId?.(open ? row.id ?? null : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg p-0 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-56 space-y-3">
          <p className="text-sm">Yakin ingin menghapus role ini?</p>

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
