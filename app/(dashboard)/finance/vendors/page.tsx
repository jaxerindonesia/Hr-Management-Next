"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import { toast } from "sonner";
import { usePermission } from "@/lib/helper/check-role";
import type { PartnerDto, PartnerFormDto } from "@/lib/dto/finance-partner";
import { parseApiError } from "@/lib/helper/response-api";
import PartnerImportModal from "../components/partner-import-modal";
import PartnerDialog from "../components/partner-form-data";
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

const DEFAULT_FORM: PartnerFormDto = {
  id: "",
  code: "",
  name: "",
  phone: "",
  email: "",
  address: "",
};

const ENDPOINT = "/api/finance/vendors";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function FinanceVendorsPage() {
  const { checkRole } = usePermission();
  const [data, setData] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [detailItem, setDetailItem] = useState<PartnerFormDto>(DEFAULT_FORM);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);
  const activeFilterCount = useMemo(() => (searchTerm ? 1 : 0), [searchTerm]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

      const res = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!res.ok) throw new Error(await parseApiError(res, "Gagal mengambil data vendor"));
      const json: PaginatedResponse<PartnerDto> = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data vendor");
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
    void loadData();
  }, [loadData]);

  const onAdd = useCallback(() => {
    setDetailItem(DEFAULT_FORM);
    setShowFormModal(true);
  }, []);

  const onView = useCallback((item: PartnerDto) => {
    setDetailItem({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
    });
    setShowFormModal(true);
  }, []);

  const save = useCallback(async () => {
    setLoading(true);
    try {
      const code = detailItem.code.trim();
      const name = detailItem.name.trim();
      const email = detailItem.email.trim().toLowerCase();

      if (!code) return toast.error("Kode wajib diisi");
      if (!name) return toast.error("Nama wajib diisi");
      if (!email) return toast.error("Email wajib diisi");
      if (!isValidEmail(email)) return toast.error("Email harus valid");

      const payload = {
        code,
        name,
        phone: detailItem.phone.trim() || null,
        email,
        address: detailItem.address.trim() || null,
      };

      const res = await fetch(detailItem.id ? `${ENDPOINT}/${detailItem.id}` : ENDPOINT, {
        method: detailItem.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan vendor");

      toast.success(detailItem.id ? "Vendor berhasil diupdate" : "Vendor berhasil ditambahkan");
      setShowFormModal(false);
      setDetailItem(DEFAULT_FORM);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan vendor");
    } finally {
      setLoading(false);
    }
  }, [detailItem, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus vendor");
      toast.success("Vendor berhasil dihapus");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus vendor");
    } finally {
      setDeleteId(null);
    }
  }, [loadData]);

  const onExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "999999");
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

      const res = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!res.ok) throw new Error(await parseApiError(res, "Gagal mengambil data vendor untuk export"));

      const json: PaginatedResponse<PartnerDto> = await res.json();
      const rows = (json.data || []).map((item) => ({
        Kode: item.code || "-",
        Nama: item.name || "-",
        Telepon: item.phone || "-",
        Email: item.email || "-",
        Alamat: item.address || "-",
      }));

      if (!rows.length) {
        toast.error("Tidak ada data vendor untuk didownload");
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor");

      type ExportRow = (typeof rows)[number];
      const headers = Object.keys(rows[0] ?? {}) as Array<keyof ExportRow>;
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(String(header).length, ...rows.map((row) => String(row[header] ?? "").length)) + 2,
      }));

      XLSX.writeFile(workbook, `data-vendor-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Berhasil mengexport ${rows.length} data vendor`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengexport data vendor");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm]);

  const toolbar = useMemo(
    () =>
      headerToolbar({
        title: "Vendor",
        actions: {
          onAdd,
          addLabel: "Tambah Vendor",
          onExport,
          onImport: () => setShowImportModal(true),
          isExporting,
          checkRole,
        },
        filters: {
          show: showFilterPanel,
          setShow: setShowFilterPanel,
          activeCount: activeFilterCount,
          clear: clearFilters,
          searchTerm,
          setSearchTerm,
          searchPlaceholder: "Cari vendor...",
        },
      }),
    [activeFilterCount, checkRole, clearFilters, isExporting, onAdd, onExport, searchTerm, showFilterPanel],
  );

  return (
    <>
      <DynamicPage<PartnerDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada data vendor"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            checkRole,
            onView,
            onDelete: handleDelete,
            deleteId,
            setDeleteId,
          })
        }
      />

      <PartnerDialog
        open={showFormModal}
        loading={loading}
        title={detailItem.id ? "Edit Vendor" : "Tambah Vendor"}
        description={detailItem.id ? "Ubah data vendor." : "Tambah vendor untuk data finance."}
        form={detailItem}
        onOpenChange={(open) => {
          setShowFormModal(open);
          if (!open) {
            setDetailItem(DEFAULT_FORM);
          }
        }}
        onChange={setDetailItem}
        onSubmit={save}
      />

      <PartnerImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        endpoint="/api/finance/vendors/import"
        entityLabel="Vendor"
        onSuccess={() => {
          void loadData();
        }}
      />
    </>
  );
}
