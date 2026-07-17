"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DynamicPage from "@/components/dynamic-page";
import { usePermission } from "@/lib/helper/check-role";
import type { OvertimeConfigDto, OvertimeDto } from "@/lib/dto/overtime";
import type { UserDto } from "@/lib/dto/user";
import type { ApiResponse } from "@/lib/utils";
import { parseApiError } from "@/lib/helper/response-api";
import ConfigModal from "./components/config-modal";
import FormData from "./components/form-data";
import { DEFAULT_CONFIG, ITEMS_PER_PAGE, columnFormats, headerToolbar, renderActions } from "./page.config";
import LastApproveModal from "./components/last-approve-modal";
import RejectModal from "./components/reject-modal";

export default function Page() {
  const { checkRole } = usePermission();
  const [data, setData] = useState<OvertimeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<OvertimeDto | undefined>(undefined);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [savedConfig, setSavedConfig] = useState<OvertimeConfigDto>(DEFAULT_CONFIG);
  const [draftConfig, setDraftConfig] = useState<OvertimeConfigDto>(DEFAULT_CONFIG);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [savedApproverUserIds, setSavedApproverUserIds] = useState<string[]>([]);
  const [draftApproverUserIds, setDraftApproverUserIds] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [approvingItem, setApprovingItem] = useState<OvertimeDto | null>(null);
  const [approvePayMethod, setApprovePayMethod] = useState<"PER_HOUR" | "PER_DAY">("PER_HOUR");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStatus !== "all") count++;
    return count;
  }, [searchTerm, filterStatus]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterStatus("all");
  }, []);

  const onAdd = useCallback(() => {
    setDetailItem(undefined);
    setShowFormModal(true);
  }, []);

  const onExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ limit: "999999" });
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const response = await fetch(`/api/overtimes?${params.toString()}`);
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data untuk export"));

      const json: ApiResponse = await response.json();
      const allData: OvertimeDto[] = json.data || [];
      const XLSX = await import("xlsx");

      const rows = allData.map((item) => ({
        Karyawan: item.user?.name ?? "-",
        Tanggal: item.overtimeDate ? new Date(item.overtimeDate).toLocaleDateString("id-ID") : "-",
        Durasi: `${Math.floor((item.overtimeMinutes || 0) / 60)} jam`,
        Nominal: item.payoutAmount || 0,
        Status: item.status || "-",
        Keterangan: item.description || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Overtime");
      XLSX.writeFile(workbook, `data-overtime-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Berhasil mengexport ${rows.length} data overtime`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, filterStatus]);

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onAdd,
          onExport,
          onOpenConfig: () => {
            setDraftConfig(savedConfig);
            setDraftApproverUserIds(savedApproverUserIds);
            setShowConfigModal(true);
          },
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
          status: filterStatus,
          setStatus: setFilterStatus,
        },
      }),
    [activeFilterCount, checkRole, clearFilters, filterStatus, isExporting, onAdd, onExport, savedApproverUserIds, savedConfig, searchTerm, showFilterPanel],
  );

  const onView = async (id: string) => {
    await fetchDetail(id);
    setShowFormModal(true);
  };

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/overtimes/${id}`, { method: "DELETE" });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal menghapus overtime");

      toast.success("Overtime berhasil dihapus!");
      fetchData();
    } catch (error) {
      toast.error(`Gagal menghapus overtime: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleteId(null);
    }
  };

  const onApprove = async (id: string, payMethod?: "PER_HOUR" | "PER_DAY") => {
    try {
      const response = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalAction: "APPROVE",
          ...(payMethod ? { payMethod } : {}),
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menyetujui overtime");

      toast.success("Overtime disetujui");
      setShowApproveModal(false);
      setApprovingItem(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyetujui overtime");
    }
  };

  const onReasonReject = () => {
    setShowRejectModal(true);
    setRejectReason("");
  };


  const onReject = async (id: string) => {
    try {
      const response = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalAction: "REJECT",
          rejectionReason: rejectReason,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menolak overtime");

      toast.success("Overtime ditolak");
      setShowRejectModal(false);
      setRejectId("");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menolak overtime");
    }
  };

  const handleAddApprover = (userId: string) => {
    if (!userId) return;
    setDraftApproverUserIds((current) => (current.includes(userId) ? current : [...current, userId]));
  };

  const handleRemoveApprover = (userId: string) => {
    setDraftApproverUserIds((current) => current.filter((id) => id !== userId));
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch("/api/overtime-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRate: draftConfig.hourlyRate,
          dailyRate: draftConfig.dailyRate,
          approverUserIds: draftApproverUserIds,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menyimpan konfigurasi lembur");

      toast.success("Konfigurasi lembur berhasil disimpan");
      setShowConfigModal(false);
      fetchConfig();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan konfigurasi lembur");
    }
  };

  const handleApproveClick = (item: OvertimeDto) => {
    if (!item.id) return;
    if (isFinalApproval(item)) {
      setApprovingItem(item);
      setApprovePayMethod("PER_HOUR");
      setShowApproveModal(true);
    } else {
      onApprove(item.id);
    }
  };

  const isFinalApproval = useCallback(
    (item: OvertimeDto) => {
      const decisions = item.approvalDecisions || [];
      const currentDecision = decisions.find(
        (decision) => decision.approverUserId === userId,
      );

      return (
        currentDecision?.status === "PENDING" &&
        decisions.filter((decision) => decision.status === "PENDING").length === 1 &&
        decisions.every(
          (decision) =>
            decision.approverUserId === userId || decision.status === "APPROVED",
        )
      );
    },
    [userId],
  );

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/overtime-config");
      if (!response.ok) {
        throw new Error(
          await parseApiError(response, "Gagal memuat konfigurasi overtime"),
        );
      }
      const json = await response.json();
      const nextConfig = json.data || DEFAULT_CONFIG;
      const nextApproverUserIds = (nextConfig.approverConfigs || []).map(
        (item: NonNullable<OvertimeConfigDto["approverConfigs"]>[number]) => item.approverUserId,
      );
      setSavedConfig(nextConfig);
      setDraftConfig(nextConfig);
      setSavedApproverUserIds(nextApproverUserIds);
      setDraftApproverUserIds(nextApproverUserIds);
    } catch (error) {
      setSavedConfig(DEFAULT_CONFIG);
      setDraftConfig(DEFAULT_CONFIG);
      setSavedApproverUserIds([]);
      setDraftApproverUserIds([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat konfigurasi lembur",
      );
    }
  }, []);

  const fetchApproverUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users?limit=9999");
      if (!response.ok) {
        throw new Error(
          await parseApiError(response, "Gagal memuat data approver"),
        );
      }
      const json = await response.json();
      const userItems: UserDto[] = json.data || [];
      setUsers(userItems.filter((user) => {
        const roleName = user.role?.name?.trim().toLowerCase();
        return Boolean(roleName) && roleName !== "karyawan";
      }));
    } catch (error) {
      setUsers([]);
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data approver",
      );
    }
  }, []);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const response = await fetch(`/api/overtimes?${params.toString()}`);
      const json: ApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((json as { message?: string }).message || "Failed to load overtimes");
      }

      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data lembur",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, filterStatus]);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/overtimes/${id}`);
      if (!response.ok) {
        throw new Error(await parseApiError(response, "Gagal memuat detail lembur"));
      }
      const json = await response.json();
      setDetailItem(json.data || undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat detail lembur",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchConfig();
    fetchApproverUsers();
  }, [fetchApproverUsers, fetchConfig]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserId(userData.id || "");
  }, []);

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
        emptyMessage="Belum ada data lembur"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            checkRole,
            onView,
            onDelete,
            onApprove: () => handleApproveClick(row),
            onReasonReject,
            setRejectId,
            deleteId,
            setDeleteId,
          })
        }
      />

      <FormData
        isOpen={showFormModal}
        initialData={detailItem}
        onClose={() => setShowFormModal(false)}
        onSuccess={fetchData}
      />

      <ConfigModal
        open={showConfigModal}
        users={users.map((user) => ({
          id: user.id ?? "",
          name: user.name,
          email: user.email,
        }))}
        approverUserIds={draftApproverUserIds}
        config={draftConfig}
        onAddApprover={handleAddApprover}
        onClose={() => {
          setDraftConfig(savedConfig);
          setDraftApproverUserIds(savedApproverUserIds);
          setShowConfigModal(false);
        }}
        onDailyRateChange={(value) => setDraftConfig((current) => ({ ...current, dailyRate: value }))}
        onHourlyRateChange={(value) => setDraftConfig((current) => ({ ...current, hourlyRate: value }))}
        onRemoveApprover={handleRemoveApprover}
        onSave={handleSaveConfig}
      />

      <RejectModal
        isOpen={showRejectModal}
        rejectReason={rejectReason}
        onClose={() => setShowRejectModal(false)}
        onConfirm={() => rejectId && onReject(rejectId)}
        onOpenChange={setShowRejectModal}
        onRejectReasonChange={setRejectReason}
      />

      <LastApproveModal
        isOpen={showApproveModal}
        approvePayMethod={approvePayMethod}
        config={savedConfig}
        onClose={() => {
          setShowApproveModal(false);
          setApprovingItem(null);
        }}
        onApprove={() => approvingItem?.id && onApprove(approvingItem.id, approvePayMethod)}
        onApprovePayMethodChange={setApprovePayMethod}
      />
    </>
  );
}
