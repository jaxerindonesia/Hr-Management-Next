"use client";

import { useRef, useState } from "react";
import { AlertCircle, Download, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildAccountImportInfoRows, buildAccountImportTemplateRows, FINANCE_IMPORT_BATCH_SIZE, isAccountRowEmpty, normalizeAccountImportRow, type FinanceImportError, validateAccountImportRow } from "@/lib/helper/finance-import";
import { parseApiError } from "@/lib/helper/response-api";

export default function AccountImportModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errors, setErrors] = useState<FinanceImportError[]>([]);

  const resetState = () => {
    setFile(null);
    setIsDownloading(false);
    setIsImporting(false);
    setProgressText("");
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const templateSheet = XLSX.utils.json_to_sheet(buildAccountImportTemplateRows());
      const infoSheet = XLSX.utils.json_to_sheet(buildAccountImportInfoRows());
      templateSheet["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
      infoSheet["!cols"] = [{ wch: 24 }, { wch: 10 }, { wch: 56 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
      XLSX.utils.book_append_sheet(workbook, infoSheet, "Petunjuk");
      XLSX.writeFile(workbook, `template-import-akun-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Template import akun berhasil didownload");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mendownload template import akun",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }

    try {
      setIsImporting(true);
      setErrors([]);
      setProgressText("Membaca file Excel...");

      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });

      const normalizedRows = rawRows
        .slice(1)
        .map((row, index) => ({ rowNumber: index + 3, payload: normalizeAccountImportRow(row) }))
        .filter(({ payload }) => !isAccountRowEmpty(payload));

      if (normalizedRows.length === 0) {
        toast.error("Tidak ada baris data yang bisa diimport");
        return;
      }

      const validationErrors = normalizedRows.flatMap(({ rowNumber, payload }) =>
        validateAccountImportRow(payload).map((error) => ({ row: rowNumber, column: error.column, message: error.message })),
      );

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast.error("Ada data template yang belum sesuai. Cek daftar error.");
        return;
      }

      const batches = [];
      for (let index = 0; index < normalizedRows.length; index += FINANCE_IMPORT_BATCH_SIZE) {
        batches.push(normalizedRows.slice(index, index + FINANCE_IMPORT_BATCH_SIZE));
      }

      const collectedErrors: FinanceImportError[] = [];
      let createdTotal = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        setProgressText(`Mengimport batch ${batchIndex + 1} dari ${batches.length}...`);
        const response = await fetch("/api/finance/accounts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batches[batchIndex] }),
        });
        if (!response.ok) {
          throw new Error(
            await parseApiError(response, "Gagal mengimport data akun"),
          );
        }
        const json = await response.json().catch(() => ({}));
        createdTotal += json.data?.created || 0;
        if (Array.isArray(json.data?.errors)) collectedErrors.push(...json.data.errors);
      }

      setErrors(collectedErrors);
      onSuccess?.();

      if (collectedErrors.length > 0) {
        toast.warning(`Import selesai. ${createdTotal} data berhasil, ${collectedErrors.length} data perlu diperbaiki.`);
        return;
      }

      toast.success(`Berhasil mengimport ${createdTotal} data akun`);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengimport data akun");
    } finally {
      setIsImporting(false);
      setProgressText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="-m-6 mb-0 rounded-t-2xl border-blue-100 px-6 pt-6 dark:border-blue-900/30 dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950">
          <DialogTitle className="text-medium font-bold text-slate-900 dark:text-slate-100">Import Data Akun</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">Download template, isi sesuai format, lalu upload kembali file Excel untuk diproses.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Template Import</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Template berisi sheet data dan petunjuk pengisian.</p>
              </div>
              <Button type="button" onClick={handleDownloadTemplate} disabled={isDownloading} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloading ? "Menyiapkan..." : "Download Template"}
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/15">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">Kolom wajib harus diisi. Jika import gagal, sistem akan menampilkan baris dan kolom yang perlu diperbaiki.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Upload File Import</p>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition-colors hover:border-blue-400 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-blue-500 dark:hover:bg-slate-900">
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setErrors([]); }} />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">{file ? file.name : "Pilih file Excel untuk diimport"}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Format yang didukung: `.xlsx` dan `.xls`</p>
              </div>
            </label>
            {progressText ? <p className="mt-3 text-sm text-blue-600 dark:text-blue-300">{progressText}</p> : null}
            {errors.length > 0 ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <div className="mb-3 flex items-center gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="h-4 w-4" />
                  <p className="font-medium">Data perlu diperbaiki</p>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {errors.slice(0, 20).map((error, index) => (
                    <p key={`${error.row}-${error.column ?? "general"}-${index}`} className="text-sm text-red-600 dark:text-red-300">
                      Baris {error.row}{error.column ? `, kolom ${error.column}` : ""}: {error.message}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>Batal</Button>
          <Button type="button" onClick={handleImport} disabled={!file || isImporting} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isImporting ? "Mengimport..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
