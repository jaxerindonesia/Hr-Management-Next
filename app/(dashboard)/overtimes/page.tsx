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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { AttendanceDto } from "@/lib/dto/attendance";
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
  overtimeBuffer: 60,
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
  const [selectedAttendanceId, setSelectedAttendanceId] = useState("");
  const [attendanceOptions, setAttendanceOptions] = useState<AttendanceDto[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const isAdmin = ["Super Admin", "Admin"].includes(userData.role);
  const activeFilterCount = useMemo(
    () => [searchQuery !== "", filterStatus !== "all"].filter(Boolean).length,
    [searchQuery, filterStatus],
  );

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
      setConfig(configJson.data || DEFAULT_CONFIG);
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
        body: JSON.stringify(config),
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

  const handleOpenRequest = async () => {
    try {
      if (!userData.id) return;
      setRequestLoading(true);
      const res = await fetch("/api/overtimes/request-options");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal memuat data kehadiran");
      const options = json.data || [];
      setAttendanceOptions(options);
      setSelectedAttendanceId(options[0]?.id || "");
      setRequestDescription("");
      setShowRequestModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data kehadiran untuk pengajuan lembur");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      if (!selectedAttendanceId) {
        toast.error("Pilih data kehadiran terlebih dahulu");
        return;
      }

      const res = await fetch("/api/overtimes/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: selectedAttendanceId,
          description: requestDescription,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal mengajukan lembur");

      toast.success("Pengajuan lembur dikirim dan menunggu approval atasan");
      setShowRequestModal(false);
      setSelectedAttendanceId("");
      setRequestDescription("");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengajukan lembur");
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

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalAction: "APPROVE" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Overtime disetujui");
      loadData();
    } catch {
      toast.error("Gagal menyetujui overtime");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = window.prompt("Masukkan alasan penolakan");
      if (!reason) return;
      const res = await fetch(`/api/overtimes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalAction: "REJECT", rejectionReason: reason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Overtime ditolak");
      loadData();
    } catch {
      toast.error("Gagal menolak overtime");
    }
  };

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
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === "PENDING" && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Keterangan"
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && item.status === "PENDING" && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleApprove(item.id || "")}>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleReject(item.id || "")}>
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
              <Label>Buffer Menit</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(config.overtimeBuffer)}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    overtimeBuffer: Number(e.target.value.replace(/\D/g, "")) || 0,
                  }))
                }
                disabled={config.payMethod === "PER_DAY"}
              />
              <p className="text-xs text-muted-foreground">
                Buffer ini hanya dipakai pada hari kerja normal sebagai toleransi setelah jam pulang.
              </p>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <div className="grid gap-2">
              <Label>Metode</Label>
              <Select
                value={config.payMethod}
                onValueChange={(v) =>
                  setConfig((prev) => ({ ...prev, payMethod: v as "PER_HOUR" | "PER_DAY" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_HOUR">Per Jam</SelectItem>
                  <SelectItem value="PER_DAY">Per Hari</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              {config.payMethod === "PER_HOUR" ? (
                <>
                  <Label>Tarif / Jam</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(config.hourlyRate)}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hourlyRate: Number(e.target.value.replace(/\D/g, "")) || 0,
                        dailyRate: 0,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Hanya tarif per jam yang dipakai saat metode ini aktif.
                  </p>
                </>
              ) : (
                <>
                  <Label>Tarif / Hari</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(config.dailyRate)}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        dailyRate: Number(e.target.value.replace(/\D/g, "")) || 0,
                        hourlyRate: 0,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Hanya tarif per hari yang dipakai saat metode ini aktif.
                  </p>
                </>
              )}
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
              <Label>Data Kehadiran</Label>
              <Select value={selectedAttendanceId} onValueChange={setSelectedAttendanceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tanggal kehadiran" />
                </SelectTrigger>
                <SelectContent>
                  {attendanceOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      - {item.checkIn ? new Date(item.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      {" / "}
                      {item.checkOut ? new Date(item.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attendanceOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada data kehadiran yang sudah check out untuk diajukan lembur.
                </p>
              )}
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
            <Button onClick={handleSubmitRequest} disabled={!selectedAttendanceId}>
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
    </>
  );
}
