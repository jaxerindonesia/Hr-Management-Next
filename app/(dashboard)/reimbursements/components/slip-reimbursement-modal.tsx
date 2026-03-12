"use client";

import { X, Printer, CheckCircle, Clock, XCircle } from "lucide-react";
import { ReimbursementDto } from "@/lib/dto/reimbursement";
import { formatCurrency } from "@/lib/helper/format-currency";

interface SlipReimbursementModalProps {
    reimbursement: ReimbursementDto;
    onClose: () => void;
}

export default function SlipReimbursementModal({
    reimbursement,
    onClose,
}: SlipReimbursementModalProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* ===== MODAL OVERLAY (hidden on print) ===== */}
            <div className="no-print fixed inset-0 z-[9999] flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Bukti Reimbursement
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Dokumen klaim pengeluaran karyawan
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Cetak / Download PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:rotate-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Slip Preview */}
                    <div className="p-6">
                        <SlipContent reimbursement={reimbursement} />
                    </div>
                </div>
            </div>
        </>
    );
}

/* ---------- Reusable slip content (also rendered on print) ---------- */
function SlipContent({ reimbursement }: { reimbursement: ReimbursementDto }) {
    const isApproved = reimbursement.status === "approved";
    const isRejected = reimbursement.status === "rejected";

    const statusConfig = isApproved
        ? { label: "Disetujui", color: "bg-green-100 text-green-700", Icon: CheckCircle }
        : isRejected
            ? { label: "Ditolak", color: "bg-red-100 text-red-700", Icon: XCircle }
            : { label: "Menunggu Persetujuan", color: "bg-yellow-100 text-yellow-700", Icon: Clock };

    const { label, color, Icon } = statusConfig;

    return (
        <div
            id="reimburse-print-area"
            className="bg-white rounded-xl overflow-hidden border border-gray-200 text-gray-800"
        >
            {/* ---- Header ---- */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <img src="/logo22.png" alt="Logo Jaxer" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wide">JAXER GRUP INDONESIA</h1>
                            <p className="text-blue-200 text-sm">Human Resources Department</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold">
                            Bukti Reimbursement
                        </p>
                        <p className="text-lg font-bold">
                            {new Date(reimbursement.date).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* ---- Info Karyawan ---- */}
            <div className="px-8 py-5 bg-blue-50 border-b border-blue-100 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Nama Karyawan
                    </p>
                    <p className="text-base font-bold text-gray-900">
                        {reimbursement.user?.name ?? "-"}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Jabatan / Departemen
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                        {reimbursement.user?.position ?? "-"} /{" "}
                        {reimbursement.user?.department ?? "-"}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Status
                    </p>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </span>
                </div>
                {isApproved && reimbursement.approvedAt && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            Tanggal Disetujui
                        </p>
                        <p className="text-base font-semibold text-gray-800">
                            {new Date(reimbursement.approvedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                )}
            </div>

            {/* ---- Detail Klaim ---- */}
            <div className="px-8 py-5">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Keterangan
                            </th>
                            <th className="text-right py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Detail
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="py-3 text-sm text-gray-700">Judul Klaim</td>
                            <td className="py-3 text-right text-sm font-medium text-gray-900">
                                {reimbursement.title}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 text-sm text-gray-700">Kategori</td>
                            <td className="py-3 text-right text-sm font-medium text-gray-900">
                                {reimbursement.category}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 text-sm text-gray-700">Tanggal Pengeluaran</td>
                            <td className="py-3 text-right text-sm font-medium text-gray-900">
                                {new Date(reimbursement.date).toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </td>
                        </tr>
                        {reimbursement.description && (
                            <tr>
                                <td className="py-3 text-sm text-gray-700">Keterangan</td>
                                <td className="py-3 text-right text-sm text-gray-600">
                                    {reimbursement.description}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Total Klaim */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Total Klaim</p>
                            <p className="text-xs text-blue-200 mt-0.5">Jumlah yang diklaim karyawan</p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(reimbursement.amount)}</p>
                    </div>
                </div>
            </div>

            {/* ---- Struk / Bukti ---- */}
            {reimbursement.receiptUrl && (
                <div className="px-8 pb-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                        Struk / Bukti Pembayaran
                    </p>
                    {reimbursement.receiptUrl.endsWith(".pdf") ? (
                        <a
                            href={reimbursement.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                            </svg>
                            Lihat Dokumen PDF
                        </a>
                    ) : (
                        <img
                            src={reimbursement.receiptUrl}
                            alt="Struk pembayaran"
                            className="max-h-60 rounded-lg border border-gray-200 object-contain"
                        />
                    )}
                </div>
            )}

            {/* ---- Footer / Tanda Tangan ---- */}
            <div className="px-8 pb-8 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-end mt-6">
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-16">Pemohon,</p>
                        <div className="border-t border-gray-400 pt-1 w-40">
                            <p className="text-xs text-gray-600 font-medium">
                                {reimbursement.user?.name ?? "Karyawan"}
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-16">Menyetujui,</p>
                        <div className="border-t border-gray-400 pt-1 w-40">
                            <p className="text-xs text-gray-600 font-medium">HRD Manager</p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Dokumen ini dibuat secara otomatis oleh sistem HR Jaxer Grup Indonesia.
                    Bukti reimbursement ini sah tanpa tanda tangan basah.
                </p>
            </div>
        </div>
    );
}
