"use client";

import type React from "react";
import { CalendarDays, Copy, Edit, Filter, Plus, Trash2, X } from "lucide-react";
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
import type { EmployeeShiftScheduleDto, WorkShiftDto } from "@/lib/dto/work-shift";
import { formatDateWithWeekdayId } from "@/lib/helper/date";

export const ITEMS_PER_PAGE = 10;

export const columnFormats: DefaultColumnFormat<EmployeeShiftScheduleDto>[] = [
  {
    key: "workDate",
    title: "Tanggal",
    textClassName: "font-semibold text-slate-900 dark:text-slate-100",
    formatter: (value) => formatDateWithWeekdayId(value),
  },
  {
    key: "userId",
    title: "Karyawan",
    formatter: (_value, row) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">{row.user?.name || "-"}</p>
        <p className="text-xs text-muted-foreground">{row.user?.nik || row.user?.position || "-"}</p>
      </div>
    ),
  },
  {
    key: "branchId",
    title: "Cabang",
    formatter: (_value, row) => row.branch?.name || "-",
  },
  {
    key: "shiftId",
    title: "Jadwal",
    formatter: (_value, row) =>
      row.isDayOff ? (
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          Libur
        </span>
      ) : (
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {row.shift?.name || "-"}
        </span>
      ),
  },
  {
    key: "isDayOff",
    title: "Jam Kerja",
    formatter: (_value, row) =>
      row.isDayOff
        ? "-"
        : `${row.shift?.startTime || "-"} - ${row.shift?.endTime || "-"}${
            row.shift?.crossesMidnight ? " (+1 hari)" : ""
          }`,
  },
];

export function headerToolbar({
  actions,
  filters,
}: {
  actions: {
    onAdd: () => void;
    onCopy: () => void;
    onCalendar: () => void;
    checkRole: (model: string, action: string) => boolean;
  };
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    branchId: string;
    setBranchId: React.Dispatch<React.SetStateAction<string>>;
    shiftId: string;
    setShiftId: React.Dispatch<React.SetStateAction<string>>;
    startDate: string;
    setStartDate: React.Dispatch<React.SetStateAction<string>>;
    endDate: string;
    setEndDate: React.Dispatch<React.SetStateAction<string>>;
    branches: BranchDto[];
    shifts: WorkShiftDto[];
  };
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions.checkRole("shift-schedules", "update") && (
          <>
            <Button
              onClick={actions.onAdd}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Atur Jadwal
            </Button>
            <Button onClick={actions.onCopy} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Salin Minggu
            </Button>
          </>
        )}
        <Button onClick={actions.onCalendar} variant="outline" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Kalender
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          onClick={() => filters.setShow(!filters.show)}
          className={`relative flex items-center gap-2 ${
            filters.show || filters.activeCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              : ""
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
            <h3 className="font-semibold text-slate-900 dark:text-white">Filter Jadwal Shift</h3>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label className="mb-2 block">Cari Karyawan</Label>
              <Input
                value={filters.searchTerm}
                onChange={(event) => filters.setSearchTerm(event.target.value)}
                placeholder="Nama atau NIK..."
              />
            </div>

            <div>
              <Label className="mb-2 block">Cabang</Label>
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

            <div>
              <Label className="mb-2 block">Shift</Label>
              <Select
                value={filters.shiftId || "all"}
                onValueChange={(value) => filters.setShiftId(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jadwal</SelectItem>
                  <SelectItem value="DAY_OFF">Libur</SelectItem>
                  {filters.shifts
                    .filter((shift) => !filters.branchId || shift.branchId === filters.branchId)
                    .map((shift) => (
                      <SelectItem key={shift.id} value={shift.id || ""}>
                        {shift.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Tanggal Mulai</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(event) => filters.setStartDate(event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Tanggal Selesai</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(event) => filters.setEndDate(event.target.value)}
              />
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
  row: EmployeeShiftScheduleDto;
  checkRole: (model: string, action: string) => boolean;
  onEdit: (row: EmployeeShiftScheduleDto) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
  setDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <div className="flex justify-end gap-2">
      {checkRole("shift-schedules", "update") && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row)}
          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {checkRole("shift-schedules", "delete") && (
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
            <p className="text-sm">Yakin ingin menghapus jadwal ini?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
                Batal
              </Button>
              <Button variant="destructive" size="sm" onClick={() => row.id && onDelete(row.id)}>
                Hapus
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}