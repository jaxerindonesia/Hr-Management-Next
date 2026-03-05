"use client";

import React, { useState, useEffect } from "react";
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

const CATEGORIES = [
    "Transportasi",
    "Akomodasi",
    "Makan & Minum",
    "Kesehatan",
    "Peralatan Kerja",
    "Komunikasi",
    "Lainnya",
];

const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
        .format(n)
        .replace("IDR", "Rp");

const STATUS_LABEL: Record<string, string> = {
    pending: "MENUNGGU",
    approved: "DISETUJUI",
    rejected: "DITOLAK",
};

const STATUS_COLOR: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ITEMS_PER_PAGE = 10;

export default function ReimbursementsPage() {
    const { checkRole, checkRoleMulti } = usePermission();
    const [reimbursements, setReimbursements] = useState<ReimbursementDto[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [slipData, setSlipData] = useState<ReimbursementDto | null>(null);
    const [userData, setUserData] = useState({ id: "", role: "" });
    const [formData, setFormData] = useState<ReimbursementDto>({
        userId: "",
        title: "",
        category: "",
        amount: 0,
        date: "",
        status: "pending",
    });

    // Filters
    const [filterName, setFilterName] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const activeFilterCount = [
        filterName !== "",
        filterCategory !== "all",
        filterStatus !== "all",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterName("");
        setFilterCategory("all");
        setFilterStatus("all");
    };

    const filtered = reimbursements.filter((r) => {
        const matchName = r.user?.name?.toLowerCase().includes(filterName.toLowerCase()) ?? true;
        const matchCat = filterCategory === "all" || r.category === filterCategory;
        const matchStatus = filterStatus === "all" || r.status === filterStatus;
        return matchName && matchCat && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const fetchData = async () => {
        try {
            const res = await fetch("/api/reimbursements");
            if (!res.ok) throw new Error();
            const json = await res.json();
            setReimbursements(json.data || []);
        } catch {
            toast.error("Gagal memuat data reimbursement");
        }
    };

    const handleOpenModal = (data?: ReimbursementDto) => {
        setFormData(
            data || {
                userId: "",
                title: "",
                category: "",
                amount: 0,
                date: "",
                status: "pending",
            }
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
            const res = await fetch(`/api/reimbursements/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Reimbursement berhasil dihapus!");
            setOpenPopoverId(null);
            fetchData();
        } catch {
            toast.error("Gagal menghapus reimbursement");
        }
    };

    useEffect(() => {
        fetchData();
        const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
        setUserData(data);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterName, filterCategory, filterStatus]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
                {/* ─── Toolbar ─── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tambah Reimbursement
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilterPanel
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400"
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
                    </button>
                </div>

                {/* ─── Filter Panel ─── */}
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
                                    Nama Karyawan
                                </label>
                                <input
                                    type="text"
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    placeholder="Filter nama..."
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
                                        <option key={c} value={c}>{c}</option>
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
                    </div>
                )}

                {/* ─── Table ─── */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="text-left p-3 font-semibold dark:text-gray-300">Karyawan</th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">Judul Klaim</th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">Kategori</th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">Tanggal</th>
                                <th className="text-right p-3 font-semibold dark:text-gray-300">Nominal</th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">Status</th>
                                <th className="text-right p-3 font-semibold dark:text-gray-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length > 0 ? (
                                paginated.map((r) => (
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
                                            {formatRp(r.amount)}
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
                            {filtered.length}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {reimbursements.length}
                        </span>{" "}
                        data
                    </div>

                    {filtered.length > 0 && (
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Halaman {currentPage} dari {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
