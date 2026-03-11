"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Printer,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/lib/helper/check-role";
import { ReimbursementDto } from "@/lib/dto/reimbursement";
import ReimbursementFormData from "./components/form-data";
import SlipReimbursementModal from "./components/slip-reimbursement-modal";
import { formatCurrency } from "@/lib/helper/format-currency";

const CATEGORIES = [
  "Transportasi",
  "Akomodasi",
  "Makan & Minum",
  "Kesehatan",
  "Peralatan Kerja",
  "Komunikasi",
  "Lainnya",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ITEMS_PER_PAGE = 10;

export default function ReimbursementsPage() {
  const { checkRole } = usePermission();
  const [reimbursements, setReimbursements] = useState<ReimbursementDto[]>([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [slipData, setSlipData] = useState<ReimbursementDto | null>(null);
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState<ReimbursementDto>({
    userId: "",
    title: "",
    category: "",
    amount: 0,
    date: "",
    status: "pending",
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

      const res = await fetch(`/api/reimbursements?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setReimbursements(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast.error("Gagal memuat data reimbursement");
    }
  }, [currentPage, searchTerm, filterCategory, filterStatus]);

  const handleOpenModal = (data?: ReimbursementDto) => {
    setFormData(
      data || {
        userId: "",
        title: "",
        category: "",
        amount: 0,
        date: "",
        status: "pending",
      },
    );
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/reimbursements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          approvedBy: userData?.id,
          approvedAt: new Date(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reimbursement berhasil disetujui!");
      fetchData();
    } catch {
      toast.error("Gagal menyetujui reimbursement");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/reimbursements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          approvedBy: userData?.id,
          approvedAt: new Date(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reimbursement berhasil ditolak!");
      fetchData();
    } catch {
      toast.error("Gagal menolak reimbursement");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reimbursements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Reimbursement berhasil dihapus!");
      setOpenPopoverId(null);
      fetchData();
    } catch {
      toast.error("Gagal menghapus reimbursement");
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

      const res = await fetch(`/api/reimbursements?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");

      const json = await res.json();
      const allData: ReimbursementDto[] = json.data || [];

      const XLSX = await import("xlsx");

      const rows = allData.map((r) => ({
        "Nama Karyawan": r.user?.name ?? "-",
        "Judul Klaim": r.title ?? "-",
        Kategori: r.category ?? "-",
        Tanggal: r.date
          ? new Date(r.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "-",
        Nominal: r.amount,
        Status: STATUS_LABEL[r.status] ?? r.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Reimbursement");

      // Auto column width
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String((r as any)[key] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      // Format Nominal column as currency
      const nominalColIndex = Object.keys(rows[0] ?? {}).indexOf("Nominal");
      if (nominalColIndex >= 0) {
        const colLetter = XLSX.utils.encode_col(nominalColIndex);
        for (let i = 2; i <= rows.length + 1; i++) {
          const cellRef = `${colLetter}${i}`;
          if (worksheet[cellRef]) {
            worksheet[cellRef].z = "#,##0";
          }
        }
      }

      const fileName = `data-reimbursement-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Berhasil mengexport ${allData.length} data reimbursement`);
    } catch (err) {
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  // Fetch data when page or filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          {checkRole("reimbursements", "create") && (
            <>
              <Button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah
              </Button>

              <div className="flex-1" />
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilterPanel
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

          {/* Export Button */}
          {checkRole("reimbursements", "export") && (
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Mengexport..." : "Export Excel"}
            </Button>
          )}
        </div>

        {showFilterPanel && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Filter Data Reimbursement
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
                  placeholder="Nama karyawan atau judul..."
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
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Cari: {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Kategori: {filterCategory}
                    <button
                      onClick={() => setFilterCategory("all")}
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
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Nama Karyawan
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Judul Klaim
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Kategori
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Tanggal
                </th>
                <th className="text-right p-3 font-semibold dark:text-gray-300">
                  Nominal
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
              {reimbursements.length > 0 ? (
                reimbursements.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-3 font-medium dark:text-white">
                      {r.user?.name ?? "-"}
                    </td>
                    <td className="p-3 dark:text-gray-300">{r.title}</td>
                    <td className="p-3 dark:text-gray-300">{r.category}</td>
                    <td className="p-3 dark:text-gray-300 text-sm">
                      {new Date(r.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right font-medium dark:text-white">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLOR[r.status] ?? ""
                        }`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Print */}
                        <button
                          onClick={() => setSlipData(r)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                          title="Cetak / Download PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Approve / Reject */}
                        {r.status === "pending" &&
                          checkRole("reimbursements", "update") && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id!)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                title="Setujui"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(r.id!)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Tolak"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        {/* Edit */}
                        {r.status === "pending" &&
                          checkRole("reimbursements", "update") && (
                            <button
                              onClick={() => handleOpenModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                        {/* Delete */}
                        {checkRole("reimbursements", "delete") && (
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
                                Yakin ingin menghapus reimbursement ini?
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada data reimbursement yang ditemukan
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
              {reimbursements.length}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
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

      {/* ─── Modals ─── */}
      {showModal && (
        <ReimbursementFormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchData}
        />
      )}

      {slipData && (
        <SlipReimbursementModal
          reimbursement={slipData}
          onClose={() => setSlipData(null)}
        />
      )}
    </div>
  );
}
