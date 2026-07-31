"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DynamicPage from "@/components/dynamic-page";
import type { BranchDto } from "@/lib/dto/branch";
import { usePermission } from "@/lib/helper/check-role";
import { parseApiError } from "@/lib/helper/response-api";
import FormData from "./components/form-data";
import {
  columnFormats,
  headerToolbar,
  ITEMS_PER_PAGE,
  renderActions,
} from "./page.config";

type PaginatedResponse = {
  data?: BranchDto[];
  total?: number;
};

const ENDPOINT = "/api/branches";

const DEFAULT_FORM: BranchDto = {
  tenantId: "",
  name: "",
  code: "",
  address: "",
  latitude: 0,
  longitude: 0,
  attendanceRadiusMeters: 100,
  locationLockEnabled: false,
  customWorkingHoursEnabled: false,
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  isActive: true,
};

export default function BranchesPage() {
  const { checkRole } = usePermission();
  const [data, setData] = useState<BranchDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<BranchDto>(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)),
    [total],
  );
  const activeFilterCount = useMemo(() => (searchTerm ? 1 : 0), [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

      const response = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data cabang"));
      const json: PaginatedResponse = await response.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data cabang");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onAdd = useCallback(() => {
    setForm(DEFAULT_FORM);
    setShowDialog(true);
  }, []);

  const onView = useCallback((branch: BranchDto) => {
    setForm(branch);
    setShowDialog(true);
  }, []);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(form.id ? `${ENDPOINT}/${form.id}` : ENDPOINT, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal menyimpan cabang"));

      toast.success(form.id ? "Cabang berhasil diperbarui" : "Cabang berhasil ditambahkan");
      setShowDialog(false);
      setForm(DEFAULT_FORM);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan cabang");
    } finally {
      setLoading(false);
    }
  }, [fetchData, form]);

  const onDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal menghapus cabang"));

      toast.success("Cabang berhasil dihapus");
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus cabang");
    } finally {
      setDeleteId(null);
    }
  }, [fetchData]);

  const toolbar = useMemo(
    () => headerToolbar({
      actions: { onAdd, checkRole },
      filters: {
        show: showFilterPanel,
        setShow: setShowFilterPanel,
        activeCount: activeFilterCount,
        clear: () => setSearchTerm(""),
        searchTerm,
        setSearchTerm,
      },
    }),
    [activeFilterCount, checkRole, onAdd, searchTerm, showFilterPanel],
  );

  return (
    <>
      <DynamicPage<BranchDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada data cabang"
        onPageChange={setCurrentPage}
        renderActions={(row) => renderActions({
          row,
          checkRole,
          onView,
          onDelete,
          deleteId,
          setDeleteId,
        })}
      />

      <FormData
        open={showDialog}
        loading={loading}
        form={form}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setForm(DEFAULT_FORM);
        }}
        onChange={setForm}
        onSubmit={onSubmit}
      />
    </>
  );
}
