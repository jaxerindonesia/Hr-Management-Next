"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OvertimeConfigDto, OvertimeDto } from "@/lib/dto/overtime";
import { formatCurrency } from "@/lib/helper/format-currency";

const ITEMS_PER_PAGE = 10;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const DEFAULT_CONFIG: OvertimeConfigDto = {
  payMethod: "PER_HOUR",
  hourlyRate: 0,
  dailyRate: 0,
};

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

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const isAdmin = ["Super Admin", "Admin"].includes(userData.role);
  const activeFilterCount = useMemo(
    () => [searchQuery !== "", filterStatus !== "all"].filter(Boolean).length,
    [searchQuery, filterStatus],
  );
  const approverColumns = useMemo(() => {
    const map = new Map<string, string>();

    (config.approverConfigs || []).forEach((cfg) => {
      if (cfg.approverUserId) {
        map.set(cfg.approverUserId, cfg.approverUser?.name || "Approver");
      }
    });

    items.forEach((item) => {
      (item.approvalDecisions || []).forEach((decision) => {
        if (decision.approverUserId) {
          map.set(decision.approverUserId, decision.approverUser?.name || "Approver");
        }
      });
    });

    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [config.approverConfigs, items]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (searchQuery) params.set("search", searchQuery);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const [overtimeRes, configRes] = await Promise.all([
        fetch(`/api/overtimes?${params.toString()}`),
        fetch("/api/overtime-config"),
      ]);

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
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else loadData();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch("/api/overtime-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRate: config.hourlyRate,
          dailyRate: config.dailyRate,
          approverUserIds,
        }),
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

  const handleAddApprover = (userId: string) => {
    if (!userId) return;
    setApproverUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const handleRemoveApprover = (userId: string) => {
    setApproverUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleOpenRequest = () => {
    const today = new Date().toISOString().split("T")[0];
    setRequestDate(today);
    setRequestStartTime("");
    setRequestEndTime("");
    setRequestDescription("");
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    try {
      if (!requestDate || !requestStartTime || !requestEndTime) {
        toast.error("Tanggal, jam mulai, dan jam selesai wajib diisi");
        return;
      }

      setRequestLoading(true);
      const res = await fetch("/api/overtimes/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overtimeDate: requestDate,
          startTime: requestStartTime,
          endTime: requestEndTime,
          description: requestDescription,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal mengajukan lembur");

      toast.success("Pengajuan lembur dikirim dan menunggu approval atasan");
      setShowRequestModal(false);
      setRequestDate("");
      setRequestStartTime("");
      setRequestEndTime("");
      setRequestDescription("");
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
      const res = await fetch(`/api/overtimes/${id}`, {
        method: "DELETE",
      });
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
        body: JSON.stringify({
          approvalAction: "APPROVE",
          ...(payMethod ? { payMethod } : {}),
        }),
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
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    try {
      const res = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalAction: "REJECT",
          rejectionReason: rejectionReason.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Overtime ditolak");
      loadData();
    } catch {
      toast.error("Gagal menolak overtime");
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedRejectId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const getApproverDecision = (item: OvertimeDto) =>
    (item.approvalDecisions || []).find((decision) => decision.approverUserId === userData.id);

  const isFinalApproval = (item: OvertimeDto) => {
    const decisions = item.approvalDecisions || [];
    const currentDecision = decisions.find((decision) => decision.approverUserId === userData.id);
    return (
      currentDecision?.status === "PENDING" &&
      decisions.filter((decision) => decision.status === "PENDING").length === 1 &&
      decisions.every(
        (decision) => decision.approverUserId === userData.id || decision.status === "APPROVED",
      )
    );
  };

  const handleApproveClick = (item: OvertimeDto) => {
    if (!item.id) return;
    if (isFinalApproval(item)) {
      setApprovingItem(item);
      setApprovePayMethod("PER_HOUR");
      setApproveDialogOpen(true);
      return;
    }
    handleApprove(item.id);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/users?limit=9999")
      .then((res) => res.json())
      .then((json) =>
        setUsers(
          (json.data || []).map((user: { id: string; name: string; email: string }) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          })),
        ),
      )
      .catch(() => setUsers([]));
  }, [isAdmin]);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {!isAdmin && userData.id && (
              <Button
                onClick={handleOpenRequest}
                disabled={requestLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </Button>
            )}

            {isAdmin && (
              <Button
                onClick={() => setShowConfigModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Konfigurasi Tarif Lembur
              </Button>
            )}

            <div className="flex-1"></div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari overtime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setFilterStatus((prev) => (prev === "all" ? "PENDING" : "all"))}
              className={`relative flex items-center gap-2 px-4 py-2 ${filterStatus !== "all"
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

          </div>

          {activeFilterCount > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                  Pencarian: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterStatus !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                  Status: {STATUS_LABEL[filterStatus] || filterStatus}
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Karyawan
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Tanggal
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Durasi
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Nominal
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Keterangan
                  </th>
                  {approverColumns.length > 0 ? (
                    approverColumns.map((approver) => (
                      <th key={approver.id} className="text-left p-3 font-semibold dark:text-gray-300">
                        Approval {approver.name}
                      </th>
                    ))
                  ) : (
                    <th className="text-left p-3 font-semibold dark:text-gray-300">
                      Approval
                    </th>
                  )}
                  <th className="text-right p-3 font-semibold dark:text-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {item.user?.name || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {new Date(item.overtimeDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {item.overtimeMinutes} menit
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {formatCurrency(item.payoutAmount || 0)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[item.status] || "bg-slate-100 text-slate-700"}`}>
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </td>
                      <td className="p-3 dark:text-gray-300 max-w-[280px] truncate">
                        {item.description || "-"}
                      </td>
                      {approverColumns.length > 0 ? (
                        approverColumns.map((approver) => {
                          const decision = (item.approvalDecisions || []).find(
                            (itemDecision) => itemDecision.approverUserId === approver.id,
                          );
                          const text = decision
                            ? `${STATUS_LABEL[decision.status] || decision.status}${decision.status === "REJECTED" && decision.reason ? `: ${decision.reason}` : ""}`
                            : "-";

                          return (
                            <td key={`${item.id}-${approver.id}`} className="p-3 text-sm dark:text-gray-300">
                              {text}
                            </td>
                          );
                        })
                      ) : (
                        <td className="p-3 text-sm text-gray-400">Belum ada approver</td>
                      )}
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === "PENDING" && item.userId === userData.id && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Keterangan"
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === "PENDING" && getApproverDecision(item)?.status === "PENDING" && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleApproveClick(item)}>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => openRejectDialog(item.id || "")}>
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {isAdmin && (
                            <Popover
                              open={openPopoverId === item.id}
                              onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? item.id || null : null)}
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus overtime ini?
                                </p>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenPopoverId(null)}
                                  >
                                    Batal
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(item.id || "")}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7 + Math.max(1, approverColumns.length)}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Belum ada overtime.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {items.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {total}
              </span>{" "}
              overtime
              {totalPages > 0 && (
                <span>
                  {" "}
                  — Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | "...")[] = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else if (currentPage <= 3) {
                      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
                    }
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm select-none"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                        >
                          {page}
                        </button>
                      ),
                    );
                  })()}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Konfigurasi Tarif Lembur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-2 md:grid-cols-1 md:items-start">
            <div className="grid gap-2">
              <Label>Pemberi Persetujuan</Label>
              <p className="text-xs text-muted-foreground">
                Pilih satu atau beberapa approver. Semua approver harus menyetujui agar lembur menjadi disetujui.
              </p>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleAddApprover(e.target.value);
                  e.currentTarget.value = "";
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Pilih approver...</option>
                {users
                  .filter((user) => !approverUserIds.includes(user.id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {approverUserIds.map((id) => {
                  const user = users.find((item) => item.id === id);
                  const configUser = config.approverConfigs?.find((cfg) => cfg.approverUserId === id)?.approverUser;
                  const name = user?.name || configUser?.name || "Approver";
                  const email = user?.email || configUser?.email || "";
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {name}{email ? ` (${email})` : ""}
                      <button
                        type="button"
                        onClick={() => handleRemoveApprover(id)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                        aria-label={`Hapus ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {approverUserIds.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Jika kosong, sistem akan memakai Admin/Super Admin sebagai approver.
                  </span>
                )}
              </div>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <div className="grid gap-2">
              <Label>Tarif / Jam</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(config.hourlyRate)}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hourlyRate: Number(e.target.value.replace(/\D/g, "")) || 0,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tarif / Hari</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(config.dailyRate)}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dailyRate: Number(e.target.value.replace(/\D/g, "")) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Approval terakhir akan memilih metode Per Jam atau Per Hari memakai tarif ini.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveConfig}>Simpan Konfigurasi</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajukan Lembur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tanggal Lembur</Label>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={requestStartTime}
                  onChange={(e) => setRequestStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={requestEndTime}
                  onChange={(e) => setRequestEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Keterangan</Label>
              <Textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="Tuliskan alasan lembur"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={requestLoading || !requestDate || !requestStartTime || !requestEndTime}
            >
              Ajukan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Keterangan Overtime</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Keterangan</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan alasan lembur"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button onClick={handleSaveEdit}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Metode Lembur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Metode</Label>
              <Select
                value={approvePayMethod}
                onValueChange={(value) => setApprovePayMethod(value as "PER_HOUR" | "PER_DAY")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_HOUR">Per Jam</SelectItem>
                  <SelectItem value="PER_DAY">Per Hari</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {approvePayMethod === "PER_HOUR"
                  ? `Tarif / Jam: ${formatCurrency(config.hourlyRate || 0)}`
                  : `Tarif / Hari: ${formatCurrency(config.dailyRate || 0)}`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!approvingItem?.id) return;
                handleApprove(approvingItem.id, approvePayMethod);
              }}
            >
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alasan Penolakan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tulis alasan penolakan..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!selectedRejectId) return;
                  await handleReject(selectedRejectId, rejectReason);
                  setRejectDialogOpen(false);
                }}
              >
                Tolak Pengajuan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
