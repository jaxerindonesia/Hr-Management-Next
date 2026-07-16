"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import { toast } from "sonner";
import { columnFormats, headerToolbar, ITEMS_PER_PAGE, renderActions, STATUS_LABEL } from "./page.config";
import { ApiResponse } from "@/lib/utils";
import { usePermission } from "@/lib/helper/check-role";
import { PettyCashDto } from "@/lib/dto/petty-cash";
import PettyCashFormData from "./components/form-data";
import PettyCashUsageModal from "./components/usage-modal";
import PettyCashDetailModal from "./components/detail-modal";

export default function Page() {
  const { checkRole } = usePermission();
  const [data, setData] = useState<PettyCashDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<PettyCashDto | undefined>(undefined);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (searchTerm) count++;
    if (filterCategory !== "all") count++;
    if (filterStatus !== "all") count++;

    return count;
  }, [searchTerm, filterCategory, filterStatus]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
  };

  const onAdd = () => {
    setDetailItem(undefined);
    setShowFormModal(true);
  };

  const onView = async (id: string) => {
    await fetchDetail(id);
    setShowFormModal(true);
  };

  const onViewDetail = async (id: string) => {
    await fetchDetail(id);
    setShowDetailModal(true);
  };

  const onViewUsage = async (id: string) => {
    await fetchDetail(id);
    setShowUsageModal(true);
  };

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pettycash/${id}`, { method: "DELETE" });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal menghapus petty cash");

      toast.success("Petty Cash berhasil dihapus!");
      fetchData();
    } catch (error) {
      toast.error(`Gagal menghapus petty cash: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleteId(null);
    }
  };

  const onExport = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      params.set("limit", "999999");
      if (searchTerm) params.set("search", searchTerm);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/pettycash?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");

      const json = await res.json();
      const allData: PettyCashDto[] = json.data || [];

      const XLSX = await import("xlsx");

      const rows = allData.map((r) => {
        const totalUsed = r.usages?.reduce((sum, u) => sum + u.amount, 0) || 0;
        return {
          "Nama Karyawan": r.user?.name ?? "-",
          Tujuan: r.purpose ?? "-",
          Kategori: r.category ?? "-",
          "Nominal Dana": r.amount,
          "Total Digunakan": totalUsed,
          "Sisa Saldo": r.amount - totalUsed,
          Bank: r.bankName ?? "-",
          "No. Rekening": r.accountNumber ?? "-",
          Status: STATUS_LABEL[r.status] ?? r.status,
          "Tanggal Ditransfer": r.transferDate
            ? new Date(r.transferDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            : "-",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Petty Cash");

      // Auto column width
      type Row = (typeof rows)[number];
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key as keyof Row] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const fileName = `data-petty-cash-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Berhasil mengexport ${allData.length} data petty cash`);
    } catch {
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  const toolbar = useMemo(() => {
    return headerToolbar({
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
        category: filterCategory,
        setCategory: setFilterCategory,
        status: filterStatus,
        setStatus: setFilterStatus,
      },
    })
  }, [searchTerm, filterCategory, filterStatus, activeFilterCount, clearFilters, onAdd, onExport, isExporting]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (searchTerm) params.set("search", searchTerm);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/pettycash?${params.toString()}`);
      const json: ApiResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((json as { message?: string })?.message || "Failed to load petty cash");
      }

      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("Gagal memuat data petty cash");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterCategory, filterStatus]);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pettycash/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setDetailItem(json.data || undefined);
    } catch {
      toast.error("Gagal memuat detail petty cash");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  return (
    <>
      <DynamicPage
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Belum ada penggunaan dana yang dilaporkan"
        onPageChange={setCurrentPage}
        renderActions={(row) => renderActions({ row, checkRole, onView, onViewDetail, onViewUsage, onDelete, deleteId, setDeleteId })}
      />

      {/* ─── Create/Edit Modal ─── */}
      <PettyCashFormData
        isOpen={showFormModal}
        initialData={detailItem}
        onClose={() => setShowFormModal(false)}
        onSuccess={fetchData}
      />

      {/* ─── Usage Reporting Modal ─── */}
      <PettyCashUsageModal
        isOpen={showUsageModal}
        pettyCashId={detailItem?.id || ""}
        onClose={() => {
          setShowUsageModal(false);
          setDetailItem(undefined);
        }}
        onSuccess={fetchData}
      />

      {/* ─── Detail Reporting Modal ─── */}
      <PettyCashDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailItem(undefined);
        }}
        detailItem={detailItem}
        loading={loading}
      />
    </>
  );
}
