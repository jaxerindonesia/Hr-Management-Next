"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import type { FinanceLedgerRowDto } from "@/lib/dto/finance";
import { usePermission } from "@/lib/helper/check-role";
import { parseApiError } from "@/lib/helper/response-api";
import { formatCurrency } from "@/lib/helper/format-currency";
import { toast } from "sonner";
import { columnFormats, headerToolbar } from "./page.config";

type LedgerAccount = {
  id: string;
  code: string;
  name: string;
};

export default function FinanceLedgerRoute() {
  const { checkRole } = usePermission();
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<FinanceLedgerRowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    void fetch("/api/finance/accounts?scope=options")
      .then((response) => response.json())
      .then((json) => setAccounts(json.data || []));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "200");
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (accountId !== "all") params.set("accountId", accountId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/finance/ledgers?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data buku besar"));
      const json = await response.json();
      setRows(json.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data buku besar");
    } finally {
      setLoading(false);
    }
  }, [accountId, debouncedSearchTerm, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeFilterCount = useMemo(
    () => [searchTerm !== "", accountId !== "all", from !== "", to !== ""].filter(Boolean).length,
    [accountId, from, searchTerm, to],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setAccountId("all");
    setFrom("");
    setTo("");
  };

  const onExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "999999");
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (accountId !== "all") params.set("accountId", accountId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/finance/ledgers?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data buku besar untuk export"));

      const json = await response.json();
      const allRows: FinanceLedgerRowDto[] = json.data || [];

      if (!allRows.length) {
        toast.error("Tidak ada data buku besar untuk didownload");
        return;
      }

      const XLSX = await import("xlsx");

      const exportRows = allRows.map((row) => ({
        Tanggal: row.journalDate
          ? new Date(row.journalDate).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "-",
        "No Jurnal": row.journalNo || "-",
        "Kode Akun": row.accountCode || "-",
        "Nama Akun": row.accountName || "-",
        Referensi: row.referenceNo || "-",
        "Deskripsi Jurnal": row.description || "-",
        "Deskripsi Detail": row.detailDescription || "-",
        Debit: Number(row.debit || 0),
        Kredit: Number(row.credit || 0),
        Saldo: Number(row.balance || 0),
        "Saldo Format": formatCurrency(Number(row.balance || 0)),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Buku Besar");

      type ExportRow = (typeof exportRows)[number];
      const headers = Object.keys(exportRows[0] ?? {}) as Array<keyof ExportRow>;
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(
          String(header).length,
          ...exportRows.map((row) => String(row[header] ?? "").length),
        ) + 2,
      }));

      const numericColumns = ["Debit", "Kredit", "Saldo"];
      for (const columnName of numericColumns) {
        const columnIndex = headers.indexOf(columnName as keyof ExportRow);
        if (columnIndex < 0) continue;

        const columnLetter = XLSX.utils.encode_col(columnIndex);
        for (let rowIndex = 2; rowIndex <= exportRows.length + 1; rowIndex += 1) {
          const cell = worksheet[`${columnLetter}${rowIndex}`];
          if (cell) {
            cell.t = "n";
            cell.z = '"Rp"#,##0';
          }
        }
      }

      const fileName = `buku-besar-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Berhasil mengexport ${allRows.length} baris buku besar`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengexport buku besar");
    } finally {
      setIsExporting(false);
    }
  }, [accountId, debouncedSearchTerm, from, to]);

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onExport,
          checkRole,
          isExporting,
        },
        filters: {
          show: showFilterPanel,
          setShow: setShowFilterPanel,
          activeCount: activeFilterCount,
          clear: clearFilters,
          searchTerm,
          setSearchTerm,
          accountId,
          setAccountId,
          from,
          setFrom,
          to,
          setTo,
          accounts,
        },
      }),
    [accountId, accounts, activeFilterCount, checkRole, from, isExporting, onExport, searchTerm, showFilterPanel, to],
  );

  return (
    <DynamicPage<FinanceLedgerRowDto>
      toolbar={toolbar}
      columns={columnFormats}
      items={rows}
      total={rows.length}
      currentPage={1}
      totalPages={1}
      loading={loading}
      emptyMessage="Belum ada data buku besar."
      bodyRowClassName="align-top"
      getRowId={(row, index) => `${row.journalNo}-${row.accountId}-${index}`}
    />
  );
}
