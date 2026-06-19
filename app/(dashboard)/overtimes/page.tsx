"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { OvertimeConfigDto, OvertimeDto } from "@/lib/dto/overtime";
import { OvertimeToolbar } from "./components/overtime-toolbar";
import { OvertimeTable } from "./components/overtime-table";
import { OvertimeModals } from "./components/overtime-modals";

const ITEMS_PER_PAGE = 10;
const STATUS_LABEL: Record<string, string> = { PENDING: "Menunggu", APPROVED: "Disetujui", REJECTED: "Ditolak" };
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const DEFAULT_CONFIG: OvertimeConfigDto = { payMethod: "PER_HOUR", hourlyRate: 0, dailyRate: 0 };

function formatNumberInput(value: number | string | null | undefined) {
  const numeric = Number(value || 0);
  return numeric ? numeric.toLocaleString("id-ID") : "";
}

export default function OvertimesPage() {
  const [items, setItems] = useState<OvertimeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OvertimeDto | null>(null);
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [config, setConfig] = useState<OvertimeConfigDto>(DEFAULT_CONFIG);
  const [description, setDescription] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestStartTime, setRequestStartTime] = useState("");
  const [requestEndTime, setRequestEndTime] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [approverUserIds, setApproverUserIds] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvingItem, setApprovingItem] = useState<OvertimeDto | null>(null);
  const [approvePayMethod, setApprovePayMethod] = useState<"PER_HOUR" | "PER_DAY">("PER_HOUR");

  const isAdmin = ["Super Admin", "Admin"].includes(userData.role);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const activeFilterCount = useMemo(() => [searchQuery !== "", filterStatus !== "all"].filter(Boolean).length, [searchQuery, filterStatus]);
  const approverColumns = useMemo(() => {
    const map = new Map<string, string>();
    (config.approverConfigs || []).forEach((cfg) => cfg.approverUserId && map.set(cfg.approverUserId, cfg.approverUser?.name || "Approver"));
    items.forEach((item) => (item.approvalDecisions || []).forEach((decision) => decision.approverUserId && map.set(decision.approverUserId, decision.approverUser?.name || "Approver")));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [config.approverConfigs, items]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(ITEMS_PER_PAGE) });
      if (searchQuery) params.set("search", searchQuery);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const [overtimeRes, configRes] = await Promise.all([fetch(`/api/overtimes?${params.toString()}`), fetch("/api/overtime-config")]);
      const overtimeJson = await overtimeRes.json();
      const configJson = await configRes.json();
      setItems(overtimeJson.data || []);
      setTotal(overtimeJson.total || 0);
      const nextConfig = configJson.data || DEFAULT_CONFIG;
      setConfig(nextConfig);
      setApproverUserIds((nextConfig.approverConfigs || []).map((cfg: { approverUserId: string }) => cfg.approverUserId));
    } catch {
      toast.error("Gagal memuat data overtime");
    }
  };

  useEffect(() => {
    loadData();
    setUserData(JSON.parse(localStorage.getItem("hr_user_data") || "{}"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => (currentPage !== 1 ? setCurrentPage(1) : loadData()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/users?limit=9999")
      .then((res) => res.json())
      .then((json) => setUsers((json.data || []).map((user: { id: string; name: string; email: string }) => ({ id: user.id, name: user.name, email: user.email }))))
      .catch(() => setUsers([]));
  }, [isAdmin]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch("/api/overtime-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: config.hourlyRate, dailyRate: config.dailyRate, approverUserIds }),
      });
      if (!res.ok) throw new Error();
      toast.success("Konfigurasi tarif lembur tersimpan");
      setShowConfigModal(false);
      loadData();
    } catch {
      toast.error("Gagal menyimpan konfigurasi tarif lembur");
    }
  };

  const handleOpenEdit = (item: OvertimeDto) => {
    setEditingItem(item);
    setDescription(item.description || "");
    setShowEditModal(true);
  };

  const handleOpenRequest = () => {
    setRequestDate(new Date().toISOString().split("T")[0]);
    setRequestStartTime("");
    setRequestEndTime("");
    setRequestDescription("");
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    try {
      if (!requestDate || !requestStartTime || !requestEndTime) return toast.error("Tanggal, jam mulai, dan jam selesai wajib diisi");
      setRequestLoading(true);
      const res = await fetch("/api/overtimes/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overtimeDate: requestDate, startTime: requestStartTime, endTime: requestEndTime, description: requestDescription }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal mengajukan lembur");
      toast.success("Pengajuan lembur dikirim dan menunggu approval atasan");
      setShowRequestModal(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengajukan lembur");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingItem?.id) return;
      const res = await fetch(`/api/overtimes/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error();
      toast.success("Keterangan overtime berhasil disimpan");
      setShowEditModal(false);
      setEditingItem(null);
      setDescription("");
      loadData();
    } catch {
      toast.error("Gagal menyimpan keterangan overtime");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/overtimes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Overtime berhasil dihapus");
      setOpenPopoverId(null);
      loadData();
    } catch {
      toast.error("Gagal menghapus overtime");
    }
  };

  const handleApprove = async (id: string, payMethod?: "PER_HOUR" | "PER_DAY") => {
    try {
      const res = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalAction: "APPROVE", ...(payMethod ? { payMethod } : {}) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal menyetujui overtime");
      toast.success("Overtime disetujui");
      setApproveDialogOpen(false);
      setApprovingItem(null);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyetujui overtime");
    }
  };

  const handleReject = async (id: string, rejectionReason: string) => {
    if (!rejectionReason.trim()) return toast.error("Alasan penolakan wajib diisi");
    try {
      const res = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalAction: "REJECT", rejectionReason: rejectionReason.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Overtime ditolak");
      loadData();
    } catch {
      toast.error("Gagal menolak overtime");
    }
  };

  const getApproverDecision = (item: OvertimeDto) => (item.approvalDecisions || []).find((decision) => decision.approverUserId === userData.id);
  const isFinalApproval = (item: OvertimeDto) => {
    const decisions = item.approvalDecisions || [];
    const currentDecision = decisions.find((decision) => decision.approverUserId === userData.id);
    return currentDecision?.status === "PENDING" && decisions.filter((decision) => decision.status === "PENDING").length === 1 && decisions.every((decision) => decision.approverUserId === userData.id || decision.status === "APPROVED");
  };

  const handleApproveClick = (item: OvertimeDto) => {
    if (!item.id) return;
    if (isFinalApproval(item)) {
      setApprovingItem(item);
      setApprovePayMethod("PER_HOUR");
      setApproveDialogOpen(true);
    } else {
      handleApprove(item.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <OvertimeToolbar
          isAdmin={isAdmin}
          userId={userData.id}
          requestLoading={requestLoading}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          activeFilterCount={activeFilterCount}
          onOpenRequest={handleOpenRequest}
          onOpenConfig={() => setShowConfigModal(true)}
          onSearchChange={setSearchQuery}
          onClearSearch={clearFilters}
          onToggleFilter={() => setFilterStatus((prev) => (prev === "all" ? "PENDING" : "all"))}
        />

        <OvertimeTable
          items={items}
          total={total}
          currentPage={currentPage}
          totalPages={totalPages}
          userId={userData.id}
          isAdmin={isAdmin}
          approverColumns={approverColumns}
          openPopoverId={openPopoverId}
          onOpenEdit={handleOpenEdit}
          onApproveClick={handleApproveClick}
          onOpenReject={(id) => {
            setSelectedRejectId(id);
            setRejectReason("");
            setRejectDialogOpen(true);
          }}
          onDelete={handleDelete}
          onToggleDeletePopover={setOpenPopoverId}
          onPageChange={setCurrentPage}
          getApproverDecision={getApproverDecision}
          statusLabel={STATUS_LABEL}
          statusColor={STATUS_COLOR}
        />
      </div>

      <OvertimeModals
        configOpen={showConfigModal}
        requestOpen={showRequestModal}
        editOpen={showEditModal}
        approveOpen={approveDialogOpen}
        rejectOpen={rejectDialogOpen}
        requestLoading={requestLoading}
        requestDate={requestDate}
        requestStartTime={requestStartTime}
        requestEndTime={requestEndTime}
        requestDescription={requestDescription}
        description={description}
        approvePayMethod={approvePayMethod}
        rejectReason={rejectReason}
        selectedRejectId={selectedRejectId}
        approverUserIds={approverUserIds}
        users={users}
        config={config}
        editingItem={editingItem}
        approvingItem={approvingItem}
        onCloseConfig={() => setShowConfigModal(false)}
        onCloseRequest={() => setShowRequestModal(false)}
        onCloseEdit={() => setShowEditModal(false)}
        onCloseApprove={() => setApproveDialogOpen(false)}
        onCloseReject={() => setRejectDialogOpen(false)}
        onSaveConfig={handleSaveConfig}
        onSubmitRequest={handleSubmitRequest}
        onSaveEdit={handleSaveEdit}
        onApprove={() => approvingItem?.id && handleApprove(approvingItem.id, approvePayMethod)}
        onReject={() => selectedRejectId && handleReject(selectedRejectId, rejectReason).then(() => setRejectDialogOpen(false))}
        onAddApprover={(userId) => userId && setApproverUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]))}
        onRemoveApprover={(userId) => setApproverUserIds((prev) => prev.filter((id) => id !== userId))}
        onRequestDateChange={setRequestDate}
        onRequestStartTimeChange={setRequestStartTime}
        onRequestEndTimeChange={setRequestEndTime}
        onRequestDescriptionChange={setRequestDescription}
        onDescriptionChange={setDescription}
        onApprovePayMethodChange={setApprovePayMethod}
        onRejectReasonChange={setRejectReason}
        onHourlyRateChange={(value) => setConfig((prev) => ({ ...prev, hourlyRate: value }))}
        onDailyRateChange={(value) => setConfig((prev) => ({ ...prev, dailyRate: value }))}
        formatNumberInput={formatNumberInput}
      />
    </div>
  );
}
