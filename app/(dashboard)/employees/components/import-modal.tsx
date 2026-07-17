"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, Download, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildEmployeeImportInfoRows,
  buildEmployeeImportTemplateRows,
  EMPLOYEE_IMPORT_BATCH_SIZE,
  getEmployeeImportColumns,
  normalizeEmployeeImportRow,
  validateEmployeeImportRow,
} from "@/lib/helper/employee-import";

type ImportErrorItem = {
  row: number;
  column?: string;
  message: string;
};

export default function ImportModal({
  isOpen,
  isSuperAdmin,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errors, setErrors] = useState<ImportErrorItem[]>([]);

  const columns = useMemo(
    () => getEmployeeImportColumns(isSuperAdmin),
    [isSuperAdmin],
  );

  const resetState = () => {
    setFile(null);
    setIsDownloading(false);
    setIsImporting(false);
    setProgressText("");
    setErrors([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);

      const XLSX = await import("xlsx");
      const templateRows = buildEmployeeImportTemplateRows(isSuperAdmin);
      const infoRows = buildEmployeeImportInfoRows(isSuperAdmin);

      const workbook = XLSX.utils.book_new();
      const templateSheet = XLSX.utils.json_to_sheet(templateRows);
      const infoSheet = XLSX.utils.json_to_sheet(infoRows);
      const templateRange = XLSX.utils.decode_range(
        templateSheet["!ref"] ?? "A1:A1",
      );
      const infoRange = XLSX.utils.decode_range(infoSheet["!ref"] ?? "A1:A1");

      const applyRowStyle = (
        sheet: Record<string, unknown>,
        rowIndex: number,
        range: { s: { c: number; r: number }; e: { c: number; r: number } },
        style: Record<string, unknown>,
      ) => {
        for (let col = range.s.c; col <= range.e.c; col += 1) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });
          const cell = sheet[cellRef] as { s?: Record<string, unknown> } | undefined;
          if (cell) {
            cell.s = style;
          }
        }
      };

      applyRowStyle(templateSheet, 0, templateRange, {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2563EB" } },
        alignment: { horizontal: "center", vertical: "center" },
      });
      applyRowStyle(templateSheet, 1, templateRange, {
        font: { bold: true, color: { rgb: "92400E" } },
        fill: { fgColor: { rgb: "FEF3C7" } },
        alignment: { horizontal: "center", vertical: "center" },
      });
      applyRowStyle(infoSheet, 0, infoRange, {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1D4ED8" } },
        alignment: { horizontal: "center", vertical: "center" },
      });

      templateSheet["!cols"] = columns.map((column) => ({
        wch: Math.max(column.label.length + 4, column.sample.length + 4, 18),
      }));
      templateSheet["!rows"] = [{ hpt: 22 }, { hpt: 20 }];

      infoSheet["!cols"] = [
        { wch: 24 },
        { wch: 10 },
        { wch: 66 },
        { wch: 28 },
      ];
      infoSheet["!rows"] = [{ hpt: 22 }];

      XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
      XLSX.utils.book_append_sheet(workbook, infoSheet, "Petunjuk");
      XLSX.writeFile(
        workbook,
        `template-import-karyawan-${isSuperAdmin ? "super-admin" : "tenant"}.xlsx`,
        { cellStyles: true },
      );

      toast.success("Template import berhasil didownload");
    } catch {
      toast.error("Gagal mendownload template import");
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
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (rawRows.length === 0) {
        toast.error("File Excel tidak berisi data");
        return;
      }

      const normalizedRows = rawRows
        .slice(1)
        .map((row, index) => ({
          rowNumber: index + 3,
          payload: normalizeEmployeeImportRow(row, isSuperAdmin),
        }))
        .filter(({ payload }) =>
          Object.values(payload).some((value) => String(value ?? "").trim() !== ""),
        );

      if (normalizedRows.length === 0) {
        toast.error("Tidak ada baris data yang bisa diimport");
        return;
      }

      const validationErrors = normalizedRows.flatMap(({ rowNumber, payload }) =>
        validateEmployeeImportRow(payload, isSuperAdmin).map((error) => ({
          row: rowNumber,
          column: error.column,
          message: error.message,
        })),
      );

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast.error("Ada data template yang belum sesuai. Cek daftar error.");
        return;
      }

      const batches: typeof normalizedRows[] = [];
      for (let index = 0; index < normalizedRows.length; index += EMPLOYEE_IMPORT_BATCH_SIZE) {
        batches.push(normalizedRows.slice(index, index + EMPLOYEE_IMPORT_BATCH_SIZE));
      }

      const collectedErrors: ImportErrorItem[] = [];
      let createdTotal = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        const batch = batches[batchIndex];
        setProgressText(
          `Mengimport batch ${batchIndex + 1} dari ${batches.length} (${batch.length} data)...`,
        );

        const response = await fetch("/api/users/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: batch,
          }),
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(json.message || "Gagal mengimport batch data");
        }

        const data = json.data as {
          created?: number;
          errors?: ImportErrorItem[];
        };

        createdTotal += data?.created || 0;
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
          collectedErrors.push(...data.errors);
        }

        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }

      setErrors(collectedErrors);
      onSuccess?.();

      if (collectedErrors.length > 0) {
        toast.warning(
          `Import selesai. ${createdTotal} data berhasil, ${collectedErrors.length} data perlu diperbaiki.`,
        );
        return;
      }

      toast.success(`Berhasil mengimport ${createdTotal} data karyawan`);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengimport data");
    } finally {
      setIsImporting(false);
      setProgressText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="-m-6 mb-0 rounded-t-2xl border-blue-100 px-6 pt-6 dark:border-blue-900/30 dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950">
          <DialogTitle className="text-medium font-bold text-slate-900 dark:text-slate-100">
            Import Data Karyawan
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Download template terlebih dahulu, isi data sesuai format, lalu upload kembali file Excel
            untuk diproses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/15">
            <div className="mb-3 flex justify-between gap-3 items-center">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Template Import</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Template berisi sheet data dan sheet petunjuk pengisian agar format kolom tetap sesuai sistem.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloading ? "Menyiapkan..." : "Download Template"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/15">
            <div className="mb-2 flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Info Pengisian
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Kolom bertanda <span className="font-semibold text-red-500">*</span> wajib diisi. Jika import gagal,
                  sistem akan menampilkan posisi error berdasarkan baris dan kolom agar lebih mudah diperbaiki.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Upload File Import</p>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition-colors hover:border-blue-400 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-blue-500 dark:hover:bg-slate-900">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                  setErrors([]);
                }}
              />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {file ? file.name : "Pilih file Excel untuk diimport"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Format yang didukung: `.xlsx` dan `.xls`
                </p>
              </div>
            </label>

            {progressText ? (
              <p className="mt-3 text-sm text-blue-600 dark:text-blue-300">{progressText}</p>
            ) : null}

            {errors.length > 0 ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <div className="mb-3 flex items-center gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="h-4 w-4" />
                  <p className="font-medium">Data perlu diperbaiki</p>
                </div>

                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {errors.slice(0, 20).map((error, index) => (
                    <p key={`${error.row}-${error.column ?? "general"}-${index}`} className="text-sm text-red-600 dark:text-red-300">
                      Baris {error.row}
                      {error.column ? `, kolom ${error.column}` : ""}: {error.message}
                    </p>
                  ))}
                </div>

                {errors.length > 20 ? (
                  <p className="mt-3 text-xs text-red-500 dark:text-red-300">
                    Menampilkan 20 error pertama dari {errors.length} error.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || isImporting}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isImporting ? "Mengimport..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
