"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DynamicPage from "@/components/dynamic-page";
import type { BranchDto } from "@/lib/dto/branch";
import type { WorkShiftDto } from "@/lib/dto/work-shift";
import { usePermission } from "@/lib/helper/check-role";
import { parseApiError } from "@/lib/helper/response-api";
import ShiftForm from "./components/shift-form";
import { columnFormats, headerToolbar, ITEMS_PER_PAGE, renderActions } from "./page.config";

const DEFAULT_FORM: WorkShiftDto = {
  branchId: "",
  name: "",
  code: "",
  startTime: "07:00",
  endTime: "15:00",
  crossesMidnight: false,
  lateToleranceMinutes: null,
  isActive: true,
};

export default function WorkShiftsPage() {
  const { checkRole } = usePermission();

  const [items, setItems] = useState<WorkShiftDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [form, setForm] = useState<WorkShiftDto>(DEFAULT_FORM);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    fetch("/api/work-shifts/options")
      .then(async (response) => {
        if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil pilihan cabang shifting"));
        return response.json();
      })
      .then((json) => setBranches(json.data || []))
      .catch((error) => {
        setBranches([]);
        toast.error(error instanceof Error ? error.message : "Gagal mengambil pilihan cabang shifting");
      });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(ITEMS_PER_PAGE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (branchId) params.set("branchId", branchId);

      const response = await fetch(`/api/work-shifts?${params.toString()}`);
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data shift"));
      const json: { data?: WorkShiftDto[]; total?: number } = await response.json();
      setItems(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil shift");
    } finally {
      setLoading(false);
    }
  }, [branchId, currentPage, debouncedSearch]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => setCurrentPage(1), [branchId, debouncedSearch]);

  const submit = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(form.id ? `/api/work-shifts/${form.id}` : "/api/work-shifts", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal menyimpan shift"));
      toast.success(form.id ? "Shift berhasil diperbarui" : "Shift berhasil ditambahkan");
      setShowForm(false);
      setForm(DEFAULT_FORM);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan shift");
    } finally {
      setLoading(false);
    }
  }, [fetchData, form]);

  const remove = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/work-shifts/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(await parseApiError(response, "Gagal menghapus shift"));
        toast.success("Shift berhasil dihapus");
        await fetchData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menghapus shift");
      } finally {
        setDeleteId(null);
      }
    },
    [fetchData],
  );

  const activeFilterCount = useMemo(
    () => Number(Boolean(searchTerm)) + Number(Boolean(branchId)),
    [branchId, searchTerm],
  );

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onAdd: () => {
            setForm(DEFAULT_FORM);
            setShowForm(true);
          },
          checkRole,
        },
        filters: {
          show: showFilterPanel,
          setShow: setShowFilterPanel,
          activeCount: activeFilterCount,
          clear: () => {
            setSearchTerm("");
            setBranchId("");
          },
          searchTerm,
          setSearchTerm,
          branchId,
          setBranchId,
          branches,
        },
      }),
    [activeFilterCount, branchId, branches, checkRole, searchTerm, showFilterPanel],
  );

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <>
      <DynamicPage<WorkShiftDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={items}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada data shift"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            checkRole,
            onEdit: (selected) => {
              setForm(selected);
              setShowForm(true);
            },
            onDelete: remove,
            deleteId,
            setDeleteId,
          })
        }
      />

      <ShiftForm
        open={showForm}
        loading={loading}
        form={form}
        branches={branches}
        onChange={setForm}
        onOpenChange={setShowForm}
        onSubmit={submit}
      />
    </>
  );
}