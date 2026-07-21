"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import { toast } from "sonner";
import FormData from "./components/form-data";
import {
  columnFormats,
  headerToolbar,
  ITEMS_PER_PAGE,
  renderActions,
  type TenantDto,
} from "./page.config";
import { parseApiError } from "@/lib/helper/response-api";

export default function Page() {
  const [data, setData] = useState<TenantDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState<TenantDto | undefined>(undefined);
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)),
    [total],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (status !== "all") count++;
    return count;
  }, [searchTerm, status]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatus("all");
  }, []);

  const onAdd = useCallback(() => {
    setDetailItem(undefined);
    setShowModal(true);
  }, []);

  const onView = useCallback((tenant: TenantDto) => {
    setDetailItem(tenant);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setDetailItem(undefined);
    setShowModal(false);
  }, []);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/tenants?${params.toString()}`);
      if (!res.ok) {
        throw new Error(
          await parseApiError(res, "Gagal mengambil data tenant"),
        );
      }

      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengambil data tenant";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, status]);

  const onDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || "Gagal menghapus tenant");
        }

        toast.success("Tenant berhasil dihapus");
        fetchTenants();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Gagal menghapus tenant";
        toast.error(message);
      } finally {
        setDeleteId(null);
      }
    },
    [fetchTenants],
  );

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onAdd,
        },
        filters: {
          show: showFilterPanel,
          setShow: setShowFilterPanel,
          activeCount: activeFilterCount,
          clear: clearFilters,
          searchTerm,
          setSearchTerm,
          status,
          setStatus,
        },
      }),
    [
      activeFilterCount,
      clearFilters,
      onAdd,
      searchTerm,
      showFilterPanel,
      status,
    ],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, status]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  if (userData.role !== "Super Admin") {
    return (
      <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-red-500">
          Halaman ini hanya bisa diakses oleh role Super Admin.
        </p>
      </div>
    );
  }

  return (
    <>
      <DynamicPage<TenantDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada data tenant"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            onView,
            onDelete,
            deleteId,
            setDeleteId,
          })
        }
      />

      <FormData
        isOpen={showModal}
        initialData={detailItem}
        onClose={handleCloseModal}
        onSuccess={fetchTenants}
      />
    </>
  );
}
