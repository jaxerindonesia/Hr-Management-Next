"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import type { AccountDto } from "@/lib/dto/finance-account";
import type { JournalDetailDto, JournalDto, JournalFormDto } from "@/lib/dto/finance-journal";
import type { PartnerDto } from "@/lib/dto/finance-partner";
import { usePermission } from "@/lib/helper/check-role";
import { parseApiError } from "@/lib/helper/response-api";
import { toast } from "sonner";
import JournalFormData from "./components/form-data";
import {
  columnFormats,
  headerToolbar,
  ITEMS_PER_PAGE,
  renderActions,
} from "./page.config";

type PaginatedResponse<T> = {
  data?: T[];
  total?: number;
};

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function getTodayInputValue() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function emptyJournalDetail(): JournalDetailDto {
  return {
    accountId: "",
    debit: 0,
    credit: 0,
    description: "",
  };
}

const DEFAULT_FORM: JournalFormDto = {
  id: "",
  journalNo: "",
  date: getTodayInputValue(),
  referenceNo: "",
  description: "",
  status: "DRAFT",
  details: [emptyJournalDetail()],
};

const ENDPOINT = "/api/finance/journals";

export default function FinanceJournalsPage() {
  const { checkRole } = usePermission();
  const [data, setData] = useState<JournalDto[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountDto[]>([]);
  const [customerOptions, setCustomerOptions] = useState<PartnerDto[]>([]);
  const [vendorOptions, setVendorOptions] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [status, setStatus] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [form, setForm] = useState<JournalFormDto>(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);
  const activeFilterCount = useMemo(
    () => [searchTerm !== "", status !== "all"].filter(Boolean).length,
    [searchTerm, status],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatus("all");
  }, []);

  const fetchAccountOptions = useCallback(async () => {
    const response = await fetch("/api/finance/accounts?scope=options");
    const json: PaginatedResponse<AccountDto> = await response.json();
    setAccountOptions(json.data || []);
  }, []);

  const fetchCustomerOptions = useCallback(async () => {
    const response = await fetch("/api/finance/customers?page=1&limit=100");
    const json: PaginatedResponse<PartnerDto> = await response.json();
    setCustomerOptions(json.data || []);
  }, []);

  const fetchVendorOptions = useCallback(async () => {
    const response = await fetch("/api/finance/vendors?page=1&limit=100");
    const json: PaginatedResponse<PartnerDto> = await response.json();
    setVendorOptions(json.data || []);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (status !== "all") params.set("status", status);

      const response = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data jurnal"));
      const json: PaginatedResponse<JournalDto> = await response.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data jurnal");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, status]);

  useEffect(() => {
    void fetchAccountOptions();
    void fetchCustomerOptions();
    void fetchVendorOptions();
  }, [fetchAccountOptions, fetchCustomerOptions, fetchVendorOptions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, status]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onAdd = useCallback(() => {
    setDialogMode("create");
    setForm(DEFAULT_FORM);
    setShowDialog(true);
  }, []);

  const loadJournalById = useCallback(async (id: string, mode: "edit" | "view") => {
    setLoading(true);
    try {
      const response = await fetch(`${ENDPOINT}/${id}`);
      const json = await response.json();
      const journal: JournalDto | null = json.data || null;
      if (!journal) throw new Error("Data jurnal tidak ditemukan");

      setForm({
        id: journal.id,
        journalNo: journal.journalNo,
        date: new Date(journal.date).toISOString().slice(0, 10),
        referenceNo: journal.referenceNo || "",
        description: journal.description || "",
        status: journal.status,
        details:
          journal.details.length > 0
            ? journal.details.map((detail) => ({
                id: detail.id,
                accountId: detail.accountId,
                debit: Number(detail.debit || 0),
                credit: Number(detail.credit || 0),
                description: detail.description || "",
                relationType: detail.customerId ? "customer" : detail.vendorId ? "vendor" : "none",
                customerId: detail.customerId || undefined,
                vendorId: detail.vendorId || undefined,
              }))
            : [emptyJournalDetail()],
      });
      setDialogMode(mode);
      setShowDialog(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil detail jurnal");
    } finally {
      setLoading(false);
    }
  }, []);

  const onGenerateJournalNo = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("scope", "generate-no");
    if (form.date) params.set("date", form.date);

    const response = await fetch(`${ENDPOINT}?${params.toString()}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.journalNo) {
      toast.error(json.message || "Gagal generate no jurnal");
      return;
    }

    setForm((current) => ({
      ...current,
      journalNo: json.journalNo,
    }));
  }, [form.date]);

  const onExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "999999");
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (status !== "all") params.set("status", status);

      const response = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!response.ok) throw new Error(await parseApiError(response, "Gagal mengambil data jurnal untuk export"));

      const json: PaginatedResponse<JournalDto> = await response.json();
      const rows = (json.data || []).map((journal) => {
        const totalDebit = journal.details.reduce((sum, detail) => sum + Number(detail.debit || 0), 0);
        const totalCredit = journal.details.reduce((sum, detail) => sum + Number(detail.credit || 0), 0);

        return {
          "No Jurnal": journal.journalNo || "-",
          Tanggal: journal.date
            ? new Date(journal.date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-",
          Referensi: journal.referenceNo || "-",
          Deskripsi: journal.description || "-",
          Status: journal.status || "-",
          "Total Debit": totalDebit,
          "Total Kredit": totalCredit,
          "Jumlah Baris": journal.details.length,
        };
      });

      if (!rows.length) {
        toast.error("Tidak ada data jurnal untuk didownload");
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Jurnal Umum");

      type ExportRow = (typeof rows)[number];
      const headers = Object.keys(rows[0] ?? {}) as Array<keyof ExportRow>;
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(
          String(header).length,
          ...rows.map((row) => String(row[header] ?? "").length),
        ) + 2,
      }));

      const numericColumns = ["Total Debit", "Total Kredit"];
      for (const columnName of numericColumns) {
        const columnIndex = headers.indexOf(columnName as keyof ExportRow);
        if (columnIndex < 0) continue;

        const columnLetter = XLSX.utils.encode_col(columnIndex);
        for (let rowIndex = 2; rowIndex <= rows.length + 1; rowIndex += 1) {
          const cell = worksheet[`${columnLetter}${rowIndex}`];
          if (cell) {
            cell.t = "n";
            cell.z = '"Rp"#,##0';
          }
        }
      }

      XLSX.writeFile(workbook, `jurnal-umum-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Berhasil mengexport ${rows.length} data jurnal`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengexport jurnal");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, status]);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const journalNo = form.journalNo.trim();
      if (!journalNo) {
        toast.error("No jurnal wajib diisi");
        return;
      }

      const invalidRowMessage = form.details
        .map((detail, index) => {
          if (!detail.accountId) return `#${index + 1}: Akun wajib dipilih`;
          if ((detail.relationType === "customer" || detail.relationType === "vendor") && !detail.customerId && !detail.vendorId) {
            return `#${index + 1}: Pilih customer atau vendor`;
          }
          if (detail.debit > 0 && detail.credit > 0) {
            return `#${index + 1}: Debit dan credit tidak boleh diisi bersamaan`;
          }
          return null;
        })
        .find((message): message is string => Boolean(message));

      if (invalidRowMessage) {
        toast.error(invalidRowMessage);
        return;
      }

      const totalDebit = form.details.reduce((sum, item) => sum + Number(item.debit || 0), 0);
      const totalCredit = form.details.reduce((sum, item) => sum + Number(item.credit || 0), 0);
      if (totalDebit !== totalCredit) {
        toast.error("Total debit dan credit harus sama");
        return;
      }

      const response = await fetch(form.id ? `${ENDPOINT}/${form.id}` : ENDPOINT, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          journalNo,
          details: form.details.map((detail) => ({
            ...detail,
            debit: Number(detail.debit),
            credit: Number(detail.credit),
            customerId: detail.relationType === "customer" ? detail.customerId || null : null,
            vendorId: detail.relationType === "vendor" ? detail.vendorId || null : null,
          })),
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        if (response.status === 409) {
          toast.error(json.message || "No jurnal sudah digunakan");
          return;
        }
        throw new Error(json.message || "Gagal menyimpan jurnal");
      }

      toast.success(form.id ? "Jurnal berhasil diupdate" : "Jurnal berhasil ditambahkan");
      setShowDialog(false);
      setDialogMode("create");
      setForm(DEFAULT_FORM);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan jurnal");
    } finally {
      setLoading(false);
    }
  }, [fetchData, form]);

  const onDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menghapus jurnal");

      toast.success("Jurnal berhasil dihapus");
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus jurnal");
    } finally {
      setDeleteId(null);
    }
  }, [fetchData]);

  const onAddDetail = useCallback(() => {
    setForm((current) => ({
      ...current,
      details: [...current.details, emptyJournalDetail()],
    }));
  }, []);

  const onRemoveDetail = useCallback((index: number) => {
    setForm((current) => ({
      ...current,
      details: current.details.filter((_, detailIndex) => detailIndex !== index),
    }));
  }, []);

  const onChangeDetail = useCallback((index: number, detail: JournalDetailDto) => {
    setForm((current) => ({
      ...current,
      details: current.details.map((item, detailIndex) => (detailIndex === index ? detail : item)),
    }));
  }, []);

  const toolbar = useMemo(
    () =>
      headerToolbar({
        actions: {
          onAdd,
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
          status,
          setStatus,
        },
      }),
    [activeFilterCount, checkRole, clearFilters, isExporting, onAdd, onExport, searchTerm, showFilterPanel, status],
  );

  return (
    <>
      <DynamicPage<JournalDto>
        toolbar={toolbar}
        columns={columnFormats}
        items={data}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        emptyMessage="Tidak ada data jurnal umum"
        onPageChange={setCurrentPage}
        renderActions={(row) =>
          renderActions({
            row,
            checkRole,
            onView: (id) => void loadJournalById(id, "view"),
            onEdit: (id) => void loadJournalById(id, "edit"),
            onDelete,
            deleteId,
            setDeleteId,
          })
        }
      />

      <JournalFormData
        open={showDialog}
        loading={loading}
        readOnly={dialogMode === "view"}
        accountOptions={accountOptions}
        customerOptions={customerOptions}
        vendorOptions={vendorOptions}
        form={form}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setDialogMode("create");
            setForm(DEFAULT_FORM);
          }
        }}
        onChange={setForm}
        onSubmit={onSubmit}
        onGenerateJournalNo={onGenerateJournalNo}
        onAddDetail={onAddDetail}
        onRemoveDetail={onRemoveDetail}
        onChangeDetail={onChangeDetail}
      />
    </>
  );
}
