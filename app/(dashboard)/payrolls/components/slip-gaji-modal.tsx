"use client";

import { X, Printer, Building2, CheckCircle, Clock } from "lucide-react";
import { PayrollDto } from "@/lib/dto/payroll";
import { months } from "@/lib/helper/date";
import { formatCurrency } from "@/lib/helper/format-currency";

interface SlipGajiModalProps {
    payroll: PayrollDto;
    onClose: () => void;
}

export default function SlipGajiModal({ payroll, onClose }: SlipGajiModalProps) {
    const monthName = months.find((m) => m.value === payroll.month)?.label ?? "-";
    const periodLabel = `${monthName} ${payroll.year}`;
    const isPaid = payroll.status === "paid";

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
                                Slip Gaji Karyawan
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Periode: {periodLabel}
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
                        <SlipContent payroll={payroll} periodLabel={periodLabel} isPaid={isPaid} />
                    </div>
                </div>
            </div>
        </>
    );
}

/* ---------- Reusable slip content ---------- */
function SlipContent({
    payroll,
    periodLabel,
    isPaid,
}: {
    payroll: PayrollDto;
    periodLabel: string;
    isPaid: boolean;
}) {
    const takeHomePay = payroll.basicSalary + payroll.allowances - payroll.deductions;

    return (
        <div id="slip-print-area" className="bg-white rounded-xl overflow-hidden border border-gray-200 text-gray-800">
            {/* ---- Header ---- */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <img
                                src="/logo22.png"
                                alt="Logo Jaxer"
                            />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold tracking-wide">JAXER GRUP INDONESIA</h1>
                            <p className="text-blue-200 text-sm">Human Resources Department</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold">
                            Slip Gaji
                        </p>
                        <p className="text-lg font-bold">{periodLabel}</p>
                    </div>
                </div>
            </div>

            {/* ---- Employee Info ---- */}
            <div className="px-8 py-5 bg-blue-50 border-b border-blue-100 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Nama Karyawan
                    </p>
                    <p className="text-base font-bold text-gray-900">
                        {payroll.user?.name ?? "-"}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Status Pembayaran
                    </p>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                            }`}
                    >
                        {isPaid ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                            <Clock className="w-3.5 h-3.5" />
                        )}
                        {isPaid ? "Sudah Dibayar" : "Menunggu Pembayaran"}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Periode
                    </p>
                    <p className="text-base font-semibold text-gray-800">{periodLabel}</p>
                </div>
                {payroll.paidAt && isPaid && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            Tanggal Dibayar
                        </p>
                        <p className="text-base font-semibold text-gray-800">
                            {new Date(payroll.paidAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                )}
            </div>

            {/* ---- Salary Breakdown ---- */}
            <div className="px-8 py-5">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Komponen Gaji
                            </th>
                            <th className="text-right py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Jumlah
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Penghasilan */}
                        <tr>
                            <td colSpan={2} className="pt-4 pb-1">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                    Penghasilan
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 pl-4 text-sm text-gray-700">Gaji Pokok</td>
                            <td className="py-2 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(payroll.basicSalary)}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 pl-4 text-sm text-gray-700">Tunjangan</td>
                            <td className="py-2 text-right text-sm font-medium text-green-600">
                                + {formatCurrency(payroll.allowances)}
                            </td>
                        </tr>

                        {/* Potongan */}
                        <tr>
                            <td colSpan={2} className="pt-4 pb-1">
                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                                    Potongan
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 pl-4 text-sm text-gray-700">Potongan</td>
                            <td className="py-2 text-right text-sm font-medium text-red-500">
                                - {formatCurrency(payroll.deductions)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Total Gaji */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Take Home Pay</p>
                            <p className="text-xs text-blue-200 mt-0.5">
                                Gaji Pokok + Tunjangan − Potongan
                            </p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(takeHomePay)}</p>
                    </div>
                </div>
            </div>

            {/* ---- Footer / Signature ---- */}
            <div className="px-8 pb-8 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-end mt-6">
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-16">Penerima Gaji,</p>
                        <div className="border-t border-gray-400 pt-1 w-40">
                            <p className="text-xs text-gray-600 font-medium">
                                {payroll.user?.name ?? "Karyawan"}
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-16">Mengetahui,</p>
                        <div className="border-t border-gray-400 pt-1 w-40">
                            <p className="text-xs text-gray-600 font-medium">HRD Manager</p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Dokumen ini dibuat secara otomatis oleh sistem HR Jaxer Grup Indonesia.
                    Slip gaji ini sah tanpa tanda tangan basah.
                </p>
            </div>
        </div>
    );
}
