"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Download,
  Info,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle,
  Clock,
  Send,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/lib/helper/check-role";
import { PettyCashDto } from "@/lib/dto/petty-cash";
import PettyCashFormData from "./components/form-data";
import PettyCashUsageModal from "./components/usage-modal";
import { formatCurrency } from "@/lib/helper/format-currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = [
  "Operasional",
  "Transportasi",
  "Konsumsi",
  "Kesehatan",
  "Lainnya",
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  TRANSFER: "Ditransfer",
  SETTLE: "Settle (Done)",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  TRANSFER:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SETTLE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const ITEMS_PER_PAGE = 10;

export default function PettyCashPage() {
  const { checkRole } = usePermission();
  const [pettyCashes, setPettyCashes] = useState<PettyCashDto[]>([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedPettyCashId, setSelectedPettyCashId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<PettyCashDto | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [isExporting, setIsExporting] = useState(false);

  const [formData, setFormData] = useState<PettyCashDto>({
    userId: "",
    purpose: "",
    category: "",
    amount: 0,
    transferDate: null,
    bankName: "",
    accountNumber: "",
    status: "PENDING",
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const activeFilterCount = [
    searchTerm !== "",
    filterCategory !== "all",
    filterStatus !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
  };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (searchTerm) params.set("search", searchTerm);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/pettycash?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPettyCashes(json.data || []);
      setTotal(json.total || 0);

      // If viewing detail, refresh the detail item
      if (detailItem) {
        const updatedDetail = (json.data || []).find((item: PettyCashDto) => item.id === detailItem.id);
        if (updatedDetail) setDetailItem(updatedDetail);
      }
    } catch {
      toast.error("Gagal memuat data petty cash");
    }
  }, [currentPage, searchTerm, filterCategory, filterStatus, detailItem]);

  const handleOpenModal = (data?: PettyCashDto) => {
    setFormData(
      data || {
        userId: "",
        purpose: "",
        category: "",
        amount: 0,
        transferDate: null,
        bankName: "",
        accountNumber: "",
        status: "PENDING",
      },
    );
    setShowModal(true);
  };

  const handleOpenUsageModal = (id: string) => {
    setSelectedPettyCashId(id);
    setShowUsageModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pettycash/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Petty Cash berhasil dihapus!");
      setOpenPopoverId(null);
      fetchData();
    } catch {
      toast.error("Gagal menghapus petty cash");
    }
  };

  const handleExport = async () => {
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
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String((r as any)[key] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const fileName = `data-petty-cash-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Berhasil mengexport ${allData.length} data petty cash`);
    } catch (err) {
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  const isAdmin = ["Super Admin", "Admin"].includes(userData.role);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          {isAdmin && (
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Buat Petty Cash
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilterPanel
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

          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Mengexport..." : "Export Excel"}
          </Button>
        </div>

        {showFilterPanel && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Filter Data Petty Cash
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Hapus Semua Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Cari
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Karyawan atau tujuan..."
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Kategori
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Kategori</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="TRANSFER">Ditransfer</option>
                  <option value="SETTLE">Settle (Done)</option>
                </select>
              </div>
            </div>
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
                  Tujuan & Kategori
                </th>
                <th className="text-right p-3 font-semibold dark:text-gray-300">
                  Nominal Dana
                </th>
                <th className="text-right p-3 font-semibold dark:text-gray-300">
                  Total Digunakan
                </th>
                <th className="text-right p-3 font-semibold dark:text-gray-300">
                  Sisa Saldo
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Status
                </th>
                <th className="text-right p-3 font-semibold dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {pettyCashes.length > 0 ? (
                pettyCashes.map((r) => {
                  const totalUsed =
                    r.usages?.reduce((sum, u) => sum + u.amount, 0) || 0;
                  const remaining = r.amount - totalUsed;

                  return (
                    <tr
                      key={r.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {r.user?.name ?? "-"}
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium dark:text-white">
                          {r.purpose}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {r.category}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="p-3 text-right text-gray-600 dark:text-gray-300">
                        {formatCurrency(totalUsed)}
                      </td>
                      <td
                        className={`p-3 text-right font-semibold ${remaining < 0
                          ? "text-red-500"
                          : "text-green-600 dark:text-green-400"
                          }`}
                      >
                        {formatCurrency(remaining)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[r.status] ?? ""
                            }`}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          {/* Details */}
                          <button
                            onClick={() => {
                              setDetailItem(r);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Detail & Laporan Penggunaan"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {/* Lapor Penggunaan (Karyawan/Admin can report usage) */}
                          {r.status === "TRANSFER" && (
                            <button
                              onClick={() => handleOpenUsageModal(r.id!)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                              title="Lapor Penggunaan"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenModal(r)}
                              className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <Popover
                              open={openPopoverId === r.id}
                              onOpenChange={(open) =>
                                setOpenPopoverId(open ? r.id! : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus petty cash ini?
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
                                    onClick={() => handleDelete(r.id!)}
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
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada data petty cash yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {pettyCashes.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {total}
            </span>{" "}
            data
            {totalPages > 0 && (
              <span>
                {" "}
                — Halaman {currentPage} dari {totalPages}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                      )
                    );
                  })()}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create/Edit Modal ─── */}
      {showModal && (
        <PettyCashFormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchData}
        />
      )}

      {/* ─── Usage Reporting Modal ─── */}
      {showUsageModal && selectedPettyCashId && (
        <PettyCashUsageModal
          pettyCashId={selectedPettyCashId}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedPettyCashId(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* ─── Details Dialog ─── */}
      {detailItem && (
        <Dialog open={showDetailModal} onOpenChange={() => {
          setDetailItem(null);
          setShowDetailModal(false);
        }}>
          <DialogContent className="w-[40vw] sm:!max-w-[90rem] max-h-[94vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Detail Petty Cash</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-3">
              {/* Header Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Pemberian Dana</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(detailItem.amount)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 flex items-center gap-3">
                  <Receipt className="w-8 h-8 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total Digunakan</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        detailItem.usages?.reduce((sum, u) => sum + u.amount, 0) || 0
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Sisa Saldo</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        detailItem.amount -
                        (detailItem.usages?.reduce((sum, u) => sum + u.amount, 0) || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Metadata */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs text-gray-500">Karyawan Penerima</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detailItem.user?.name ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tujuan</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detailItem.purpose}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kategori</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detailItem.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${STATUS_COLOR[detailItem.status] ?? ""
                      }`}
                  >
                    {STATUS_LABEL[detailItem.status] ?? detailItem.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bank Tujuan</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detailItem.bankName} - {detailItem.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tanggal Ditransfer</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detailItem.transferDate
                      ? new Date(detailItem.transferDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      : "Belum ditransfer"}
                  </p>
                </div>
              </div>

              {/* Usages Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-500" />
                  Rincian Penggunaan Dana
                </h4>

                {detailItem.usages && detailItem.usages.length > 0 ? (
                  <div className="space-y-3">
                    {detailItem.usages.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-start"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {u.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(u.usageDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white text-right">
                            {formatCurrency(u.amount)}
                          </p>
                          {u.receiptUrl && (
                            <a
                              href={u.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> Bukti Struk
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 border border-dashed rounded-xl">
                    Belum ada penggunaan dana yang dilaporkan.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
