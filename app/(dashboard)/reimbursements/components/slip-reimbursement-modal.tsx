"use client";

import { useEffect, useState } from "react";
import { X, Printer, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { ReimbursementDto } from "@/lib/dto/reimbursement";
import { formatCurrency } from "@/lib/helper/format-currency";

interface SlipReimbursementModalProps {
  open?: boolean;
  detailItem?: ReimbursementDto;
  onClose: () => void;
  loading?: boolean;
}

type TenantConfig = {
  companyName?: string | null;
  companyUrl?: string | null;
  logoUrl?: string | null;
};

export default function SlipReimbursementModal({
  open = true,
  detailItem,
  onClose,
  loading = false,
}: SlipReimbursementModalProps) {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hr_user_data");
      if (!raw) return;

      const parsed = JSON.parse(raw) as TenantConfig;
      setTenantConfig({
        companyName: parsed.companyName ?? null,
        companyUrl: parsed.companyUrl ?? null,
        logoUrl: parsed.logoUrl ?? null,
      });
    } catch {
      setTenantConfig(null);
    }
  }, []);

  if (!open) return null;

  const handlePrint = () => {
    const slip = document.getElementById("reimburse-print-area");
    if (!slip) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Bukti Reimbursement</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #reimburse-print-area {
              width: 190mm !important;
              max-width: 190mm !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
            }
            #reimburse-print-area img {
              max-width: 100% !important;
              height: auto !important;
            }
            #reimburse-print-area table,
            #reimburse-print-area tr,
            #reimburse-print-area td,
            #reimburse-print-area th,
            #reimburse-print-area div {
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background:#fff;">
          ${slip.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      } catch {
        printWindow.close();
      }
    };

    if (printWindow.document.readyState === "complete") {
      setTimeout(doPrint, 250);
    } else {
      printWindow.onload = () => setTimeout(doPrint, 250);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b p-6 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bukti Reimbursement</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Dokumen klaim pengeluaran karyawan</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Cetak / Download PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-all hover:rotate-90 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!detailItem || loading ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Memuat detail reimbursement..." : "Data reimbursement tidak ditemukan."}
            </div>
          ) : (
            <SlipContent reimbursement={detailItem} tenantConfig={tenantConfig} />
          )}
        </div>
      </div>
    </div>
  );
}

function SlipContent({
  reimbursement,
  tenantConfig,
}: {
  reimbursement: ReimbursementDto;
  tenantConfig?: TenantConfig | null;
}) {
  const generatedAtLabel = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const referenceNumber =
    reimbursement.referenceNumber ||
    (reimbursement.createdAt
      ? `RBM-${new Date(reimbursement.createdAt).getFullYear()}-${String(reimbursement.id || "").slice(0, 8).toUpperCase()}`
      : `RBM-${String(reimbursement.id || "").slice(0, 8).toUpperCase()}`);
  const normalizedStatus = String(reimbursement.status || "").toUpperCase();
  const isApproved = normalizedStatus === "APPROVED";
  const isRejected = normalizedStatus === "REJECTED";
  const departmentLabel =
    typeof reimbursement.user?.department === "string"
      ? reimbursement.user.department
      : reimbursement.user?.department?.name;

  const companyName = tenantConfig?.companyName?.trim() || "JAXER GRUP INDONESIA";
  const companyUrl = tenantConfig?.companyUrl?.trim() || "";
  const companyLogo = tenantConfig?.logoUrl || "/logo22.png";

  const statusConfig = isApproved
    ? { label: "Dokumen Disetujui", color: "bg-green-100 text-green-700", Icon: CheckCircle }
    : isRejected
      ? { label: "Dokumen Ditolak", color: "bg-red-100 text-red-700", Icon: XCircle }
      : { label: "Menunggu Persetujuan", color: "bg-yellow-100 text-yellow-700", Icon: Clock };

  const { label, color, Icon } = statusConfig;

  return (
    <div
      id="reimburse-print-area"
      className="overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800"
      style={{ backgroundColor: "#fff", color: "#1f2937" }}
    >
      <div
        className="px-8 py-6 text-white"
        style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md">
              <img
                src={companyLogo}
                alt={`Logo ${companyName}`}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">{companyName}</h1>
              <p className="text-sm text-blue-200">Human Resources Department</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
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

        <div className="border-b border-blue-100 bg-blue-50 px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Karyawan</p>
            <p className="text-base font-bold text-gray-900">{reimbursement.user?.name ?? "-"}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Jabatan / Departemen</p>
            <p className="text-base font-semibold text-gray-800">
              {reimbursement.user?.position ?? "-"} / {departmentLabel ?? "-"}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {isApproved && reimbursement.approvedAt ? "Tanggal Disetujui" : "Tanggal Dokumen"}
            </p>
            <p className="text-base font-semibold text-gray-800">
              {new Date(isApproved && reimbursement.approvedAt ? reimbursement.approvedAt : reimbursement.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Nomor Referensi</p>
            <p className="text-base font-semibold text-gray-800">{referenceNumber}</p>
          </div>
          <div className="flex-1" />
        </div>
      </div>

      <div className="px-8 py-5">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Keterangan
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 text-sm text-gray-700">Judul Klaim</td>
              <td className="py-3 text-right text-sm font-medium text-gray-900">{reimbursement.title}</td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-gray-700">Kategori</td>
              <td className="py-3 text-right text-sm font-medium text-gray-900">{reimbursement.category}</td>
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
            <tr>
              <td className="py-3 text-sm text-gray-700">Bank Tujuan</td>
              <td className="py-3 text-right text-sm font-medium text-gray-900">
                {reimbursement.bankName || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-gray-700">No. Rekening</td>
              <td className="py-3 text-right text-sm font-medium text-gray-900">
                {reimbursement.accountNumber || "-"}
              </td>
            </tr>
            {reimbursement.description ? (
              <tr>
                <td className="py-3 text-sm text-gray-700">Keterangan</td>
                <td className="py-3 text-right text-sm text-gray-600">{reimbursement.description}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 p-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Klaim</p>
              <p className="mt-0.5 text-xs text-blue-200">Jumlah yang diklaim karyawan</p>
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(reimbursement.amount)}</p>
          </div>
        </div>
      </div>

      {reimbursement.receiptUrl ? (
        <div className="px-8 pb-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Struk / Bukti Pembayaran
          </p>
          {reimbursement.receiptUrl.endsWith(".pdf") ? (
            <a
              href={reimbursement.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Lihat Dokumen PDF
            </a>
          ) : (
            <img
              src={reimbursement.receiptUrl}
              alt="Struk pembayaran"
              className="max-h-32 rounded-lg border border-gray-200 object-contain"
            />
          )}
        </div>
      ) : null}

      <div className="border-t border-gray-100 px-8 pb-8 pt-2">
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Validasi Dokumen
          </p>
          <div className="mt-2 grid gap-2 text-sm text-slate-700">
            <p>
              Dokumen ini valid berdasarkan status reimbursement di sistem:{" "}
              <span className="font-semibold">{label}</span>.
            </p>
            <p>
              Waktu slip dibuka/dicetak:{" "}
              <span className="font-semibold">{generatedAtLabel}</span>.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Dokumen ini dibuat secara otomatis oleh sistem HR {companyName}.
          {companyUrl ? ` Informasi perusahaan: ${companyUrl}.` : ""}
        </p>
      </div>
    </div>
  );
}
