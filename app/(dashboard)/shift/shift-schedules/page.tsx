"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DynamicPage from "@/components/dynamic-page";
import type { BranchDto } from "@/lib/dto/branch";
import type { EmployeeShiftScheduleDto, WorkShiftDto } from "@/lib/dto/work-shift";
import { usePermission } from "@/lib/helper/check-role";
import { parseApiError } from "@/lib/helper/response-api";
import CopyWeekDialog from "./components/copy-week-dialog";
import FormData, { type ScheduleFormValue } from "./components/form-data";
import WeekMatrixDialog from "./components/week-matrix-dialog";
import { columnFormats, headerToolbar, ITEMS_PER_PAGE, renderActions } from "./page.config";

export default function ShiftSchedulesPage() {
  const { checkRole } = usePermission();

  const [data, setData] = useState<EmployeeShiftScheduleDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [shifts, setShifts] = useState<WorkShiftDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeShiftScheduleDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [branchId, setBranchId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);

  const activeFilterCount = useMemo(
    () => [searchTerm, branchId, shiftId, startDate, endDate].filter(Boolean).length,
    [branchId, endDate, searchTerm, shiftId, startDate],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [branchId, debouncedSearchTerm, endDate, shiftId, startDate]);

  useEffect(() => {
    fetch("/api/work-shifts/options?includeShifts=true")
      .then(async (response) => {
        if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil pilihan jadwal shift"));
        const json = await response.json();
        setBranches(json.data || []);
        setShifts(json.shifts || []);
      })
      .catch((error) => {
        setBranches([]);
        setShifts([]);
        toast.error(error instanceof Error ? error.message : "Gagal mengambil pilihan jadwal shift");
      });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(ITEMS_PER_PAGE) });
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (branchId) params.set("branchId", branchId);
      if (shiftId) params.set("shiftId", shiftId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/shift-schedules?${params.toString()}`);
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil jadwal shift"));
      const json = await response.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil jadwal shift");
    } finally {
      setLoading(false);
    }
  }, [branchId, currentPage, debouncedSearchTerm, endDate, shiftId, startDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const saveSchedule = useCallback(
    async (form: ScheduleFormValue) => {
      if (
        !form.branchId ||
        (!form.shiftId && !form.isDayOff) ||
        form.userIds.length === 0 ||
        !form.startDate ||
        !form.endDate ||
        form.endDate < form.startDate
      ) {
        return toast.error("Lengkapi cabang, jadwal, karyawan, dan rentang tanggal");
      }

      const dates: string[] = [];
      const current = new Date(`${form.startDate}T12:00:00`);
      const end = new Date(`${form.endDate}T12:00:00`);
      while (current <= end) {
        dates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
      }

      setLoading(true);
      try {
        const response = await fetch("/api/shift-schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: form.branchId,
            shiftId: form.shiftId || null,
            isDayOff: form.isDayOff,
            userIds: form.userIds,
            dates,
          }),
        });
        if (!response.ok) throw new Error(await parseApiError(response, "Gagal menyimpan jadwal shift"));
        toast.success("Jadwal shift berhasil disimpan");
        setShowForm(false);
        setEditItem(null);
        await fetchData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan jadwal shift");
      } finally {
        setLoading(false);
      }
    },
    [fetchData],
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/shift-schedules?ids=${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(await parseApiError(response, "Gagal menghapus jadwal"));
        toast.success("Jadwal berhasil dihapus");
        await fetchData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menghapus jadwal");
      } finally {
        setDeleteId(null);
      }
    },
    [fetchData],
  );

  const copyWeek = useCallback(
    async (value: { branchId: string; sourceStartDate: string; targetStartDate: string }) => {
      if (!value.branchId || !value.sourceStartDate || !value.targetStartDate) {
        return toast.error("Lengkapi cabang dan minggu sumber/tujuan");
      }
      setLoading(true);
      try {
        const response = await fetch("/api/shift-schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "COPY_WEEK", ...value }),
        });
        if (!response.ok) throw new Error(await parseApiError(response, "Gagal menyalin jadwal"));
        const json = await response.json();
        toast.success(json.message || "Jadwal berhasil disalin");
        setShowCopyDialog(false);
        await fetchData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyalin jadwal");
      } finally {
        setLoading(false);
      }
    },
    [fetchData],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setBranchId("");
    setShiftId("");
    setStartDate("");
    setEndDate("");
  }, []);

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onAdd: () => {
            setEditItem(null);
            setShowForm(true);
          },
          onCopy: () => setShowCopyDialog(true),
          onCalendar: () => setShowCalendar(true),
          checkRole,
        },
        filters: {
          show: showFilterPanel,
          setShow: setShowFilterPanel,
          activeCount: activeFilterCount,
          clear: clearFilters,
          searchTerm,
          setSearchTerm,
          branchId,
          setBranchId,
          shiftId,
          setShiftId,
          startDate,
          setStartDate,
          endDate,
          setEndDate,
          branches,
          shifts,
        },
      }),
    [
      activeFilterCount,
      branchId,
      branches,
      checkRole,
      clearFilters,
      endDate,
      searchTerm,
      shiftId,
      shifts,
      showFilterPanel,
      startDate,
    ],
  );

  return (
    <>
      <DynamicPage<EmployeeShiftScheduleDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada jadwal shift"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            checkRole,
            onEdit: (item) => {
              setEditItem(item);
              setShowForm(true);
            },
            onDelete: deleteSchedule,
            deleteId,
            setDeleteId,
          })
        }
      />

      <FormData
        key={editItem?.id || (showForm ? "new-open" : "new-closed")}
        open={showForm}
        loading={loading}
        initialData={editItem}
        branches={branches}
        shifts={shifts}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditItem(null);
        }}
        onSubmit={saveSchedule}
      />

      <CopyWeekDialog
        open={showCopyDialog}
        loading={loading}
        branches={branches}
        onOpenChange={setShowCopyDialog}
        onSubmit={copyWeek}
      />

      <WeekMatrixDialog open={showCalendar} branches={branches} onOpenChange={setShowCalendar} />
    </>
  );
}
