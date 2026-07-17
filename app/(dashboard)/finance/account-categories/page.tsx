"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import type { AccountCategoryDto } from "@/lib/dto/finance-account-category";
import type { CategoryFormDto } from "@/lib/dto/finance-form";
import { usePermission } from "@/lib/helper/check-role";
import { toast } from "sonner";
import FormData from "./components/form-data";
import {
  columnFormats,
  headerToolbar,
  ITEMS_PER_PAGE,
  renderActions,
} from "./page.config";

type PaginatedResponse<T> = {
  data?: T[];
  total?: number;
};

const DEFAULT_FORM: CategoryFormDto = {
  id: "",
  code: "",
  name: "",
};

const ENDPOINT = "/api/finance/account-categories";

export default function FinanceAccountCategoriesPage() {
  const { checkRole } = usePermission();
  const [data, setData] = useState<AccountCategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CategoryFormDto>(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);
  const activeFilterCount = useMemo(() => (searchTerm ? 1 : 0), [searchTerm]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

      const response = await fetch(`${ENDPOINT}?${params.toString()}`);
      const json: PaginatedResponse<AccountCategoryDto> = await response.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data kategori akun");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

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

  const onView = useCallback((item: AccountCategoryDto) => {
    setForm({
      id: item.id,
      code: item.code,
      name: item.name,
    });
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

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        if (response.status === 409) {
          toast.error(json.message || "Kode kategori akun sudah digunakan");
          return;
        }
        throw new Error(json.message || "Gagal menyimpan kategori akun");
      }

      toast.success(form.id ? "Kategori akun berhasil diupdate" : "Kategori akun berhasil ditambahkan");
      setShowDialog(false);
      setForm(DEFAULT_FORM);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan kategori akun");
    } finally {
      setLoading(false);
    }
  }, [fetchData, form]);

  const onDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menghapus kategori akun");

      toast.success("Kategori akun berhasil dihapus");
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus kategori akun");
    } finally {
      setDeleteId(null);
    }
  }, [fetchData]);

  const onExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "999999");
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

      const response = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!response.ok) throw new Error("Gagal mengambil data kategori akun untuk export");

      const json: PaginatedResponse<AccountCategoryDto> = await response.json();
      const rows = (json.data || []).map((item) => ({
        Kode: item.code || "-",
        Nama: item.name || "-",
      }));

      if (!rows.length) {
        toast.error("Tidak ada data kategori akun untuk didownload");
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Kategori Akun");

      type ExportRow = (typeof rows)[number];
      const headers = Object.keys(rows[0] ?? {}) as Array<keyof ExportRow>;
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(String(header).length, ...rows.map((row) => String(row[header] ?? "").length)) + 2,
      }));

      XLSX.writeFile(workbook, `kategori-akun-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Berhasil mengexport ${rows.length} data kategori akun`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengexport kategori akun");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm]);

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onAdd,
          onExport,
          checkRole,
          isExporting,
        },
        filters: {
          show: showFilterPanel,
          setShow: setShowFilterPanel,
          activeCount: activeFilterCount,
          clear: clearFilters,
          searchTerm,
          setSearchTerm,
        },
      }),
    [activeFilterCount, checkRole, clearFilters, isExporting, onAdd, onExport, searchTerm, showFilterPanel],
  );

  return (
    <>
      <DynamicPage<AccountCategoryDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada data kategori akun"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            checkRole,
            onView,
            onDelete,
            deleteId,
            setDeleteId,
          })
        }
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
