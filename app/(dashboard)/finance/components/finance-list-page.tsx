"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Edit, Eye, Filter, Plus, Search, Trash2, X } from "lucide-react";
import AccountDialog from "./account-dialog";
import CategoryDialog from "./category-dialog";
import JournalDialog from "./journal-dialog";
import PartnerDialog from "./partner-dialog";
import type {
  Account,
  AccountCategory,
  AccountFormState,
  CategoryFormState,
  Journal,
  JournalDetail,
  JournalFormState,
  Partner,
  PartnerFormState,
} from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/lib/helper/check-role";
import { toast } from "sonner";

type Props = {
  title: string;
  description: string;
  mode: "categories" | "accounts" | "journals" | "customers" | "vendors";
};

type PaginatedResponse<T> = {
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
};

const ITEMS_PER_PAGE = 10;
const emptyJournalDetail = (): JournalDetail => ({ accountId: "", debit: 0, credit: 0, description: "" });
const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function formatDateParts(date: Date, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: JAKARTA_TIME_ZONE }).format(date);
}

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

function formatJournalDate(date: string) {
  return formatDateParts(new Date(date), "id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function getJournalNominal(details: JournalDetail[]) {
  return details.reduce((sum, item) => sum + Number(item.debit || 0), 0);
}

export default function FinanceListPage({ title, mode }: Props) {
  const { checkRole, checkRoleMulti } = usePermission();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<AccountCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountOptions, setAccountOptions] = useState<Account[]>([]);
  const [customerOptions, setCustomerOptions] = useState<Partner[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Partner[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [journalDialogMode, setJournalDialogMode] = useState<"create" | "edit" | "view">("create");
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({ id: "", code: "", name: "" });
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    id: "",
    code: "",
    name: "",
    normalBalance: "DEBIT",
    accountCategoryId: "",
    isActive: true,
  });
  const [journalForm, setJournalForm] = useState<JournalFormState>({
    id: "",
    journalNo: "",
    date: getTodayInputValue(),
    referenceNo: "",
    description: "",
    status: "DRAFT",
    details: [emptyJournalDetail()],
  });
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>({
    id: "",
    code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const hasLoadedCategoryOptions = useRef(false);
  const hasLoadedAccountOptions = useRef(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCategoriesOptions = async () => {
    const res = await fetch("/api/finance/account-categories?scope=options");
    const json: PaginatedResponse<AccountCategory> = await res.json();
    setCategoryOptions(json.data || []);
    hasLoadedCategoryOptions.current = true;
  };

  const fetchAccountOptions = async () => {
    const res = await fetch("/api/finance/accounts?scope=options");
    const json: PaginatedResponse<Account> = await res.json();
    setAccountOptions(json.data || []);
    hasLoadedAccountOptions.current = true;
  };

  const fetchCustomerOptions = async () => {
    const res = await fetch("/api/finance/customers?page=1&limit=100");
    const json: PaginatedResponse<Partner> = await res.json();
    setCustomerOptions(json.data || []);
  };

  const fetchVendorOptions = async () => {
    const res = await fetch("/api/finance/vendors?page=1&limit=100");
    const json: PaginatedResponse<Partner> = await res.json();
    setVendorOptions(json.data || []);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "categories") {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(ITEMS_PER_PAGE));
        if (searchTerm) params.set("search", searchTerm);

        const res = await fetch(`/api/finance/account-categories?${params.toString()}`);
        const json: PaginatedResponse<AccountCategory> = await res.json();
        setCategories(json.data || []);
        setAccounts([]);
        setJournals([]);
        setTotal(json.total || 0);
        return;
      }

      if (mode === "accounts") {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(ITEMS_PER_PAGE));
        if (searchTerm) params.set("search", searchTerm);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (categoryFilter !== "all") params.set("accountCategoryId", categoryFilter);

        const accountRes = await fetch(`/api/finance/accounts?${params.toString()}`);

        const json: PaginatedResponse<Account> = await accountRes.json();
        setAccounts(json.data || []);
        setJournals([]);
        setPartners([]);
        setTotal(json.total || 0);
        return;
      }

      if (mode === "customers" || mode === "vendors") {
        const endpoint = mode === "customers" ? "/api/finance/customers" : "/api/finance/vendors";
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(ITEMS_PER_PAGE));
        if (searchTerm) params.set("search", searchTerm);
        const res = await fetch(`${endpoint}?${params.toString()}`);
        const json: PaginatedResponse<Partner> = await res.json();
        setPartners(json.data || []);
        setCategories([]);
        setAccounts([]);
        setJournals([]);
        setTotal(json.total || 0);
        return;
      }

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/finance/journals?${params.toString()}`);
      const json: PaginatedResponse<Journal> = await res.json();
      setJournals(json.data || []);
      setAccounts([]);
      setPartners([]);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, mode, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    if (mode === "accounts" && !hasLoadedCategoryOptions.current) {
      void fetchCategoriesOptions();
    }
    if (mode === "journals" && !hasLoadedAccountOptions.current) {
      void fetchAccountOptions();
    }
    if (mode === "journals" && customerOptions.length === 0) {
      void fetchCustomerOptions();
    }
    if (mode === "journals" && vendorOptions.length === 0) {
      void fetchVendorOptions();
    }
  }, [mode, customerOptions.length, vendorOptions.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, mode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (total === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, total, totalPages]);

  const visiblePages = useMemo(() => {
    const pages: Array<number | "..."> = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-100 dark:bg-gray-700" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-gray-700 sm:w-64" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-gray-700 sm:w-40" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-slate-50 dark:bg-gray-700/40" />
          </div>
        </div>
      </div>
    );
  }

  const searchPlaceholder =
    mode === "categories"
      ? "Cari kode, nama kategori..."
      : mode === "accounts"
        ? "Cari kode & nama akun..."
        : mode === "customers"
          ? "Cari kode & nama customer..."
          : mode === "vendors"
            ? "Cari kode & nama vendor..."
            : "Cari nomor jurnal...";

  const activeFilterCount = [
    searchTerm !== "",
    statusFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length;

  const clearAccountFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const saveCategory = async () => {
    setLoading(true);
    try {
      await fetch(
        categoryForm.id
          ? `/api/finance/account-categories/${categoryForm.id}`
          : "/api/finance/account-categories",
        {
          method: categoryForm.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryForm),
        },
      );
      setCategoryDialogOpen(false);
      setCategoryForm({ id: "", code: "", name: "" });
      await loadData();
      if (mode === "accounts") await fetchCategoriesOptions();
    } finally {
      setLoading(false);
    }
  };

  const saveAccount = async () => {
    setLoading(true);
    try {
      await fetch(
        accountForm.id ? `/api/finance/accounts/${accountForm.id}` : "/api/finance/accounts",
        {
          method: accountForm.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountForm),
        },
      );
      setAccountDialogOpen(false);
      setAccountForm({
        id: "",
        code: "",
        name: "",
        normalBalance: "DEBIT",
        accountCategoryId: "",
        isActive: true,
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const saveJournal = async () => {
    setLoading(true);
    try {
      const journalNo = journalForm.journalNo.trim();
      if (!journalNo) {
        toast.error("No jurnal wajib diisi");
        return;
      }

      const invalidRowMessage = journalForm.details
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

      const totalDebit = journalForm.details.reduce((sum, item) => sum + Number(item.debit || 0), 0);
      const totalCredit = journalForm.details.reduce((sum, item) => sum + Number(item.credit || 0), 0);
      if (totalDebit !== totalCredit) {
        toast.error("Total debit dan credit harus sama");
        return;
      }

      const res = await fetch(
            journalForm.id ? `/api/finance/journals/${journalForm.id}` : "/api/finance/journals",
        {
          method: journalForm.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...journalForm,
            journalNo,
            details: journalForm.details.map((detail) => ({
              ...detail,
              debit: Number(detail.debit),
              credit: Number(detail.credit),
              customerId: detail.relationType === "customer" ? detail.customerId || null : null,
              vendorId: detail.relationType === "vendor" ? detail.vendorId || null : null,
            })),
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          toast.error(err.message || "No jurnal sudah digunakan");
          return;
        }
        toast.error(err.message || "Gagal menyimpan jurnal");
        return;
      }

      setJournalDialogOpen(false);
      setJournalDialogMode("create");
      setJournalForm({
        id: "",
        journalNo: "",
        date: getTodayInputValue(),
        referenceNo: "",
        description: "",
        status: "DRAFT",
        details: [emptyJournalDetail()],
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const savePartner = async () => {
    setLoading(true);
    try {
      const endpoint = mode === "customers" ? "/api/finance/customers" : "/api/finance/vendors";
      const res = await fetch(partnerForm.id ? `${endpoint}/${partnerForm.id}` : endpoint, {
        method: partnerForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: partnerForm.code,
          name: partnerForm.name,
          phone: partnerForm.phone || null,
          email: partnerForm.email || null,
          address: partnerForm.address || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Gagal menyimpan data");
        return;
      }
      setPartnerDialogOpen(false);
      setPartnerForm({ id: "", code: "", name: "", phone: "", email: "", address: "" });
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (item: AccountCategory) => {
    setCategoryForm({
      id: item.id,
      code: item.code,
      name: item.name,
    });
    setCategoryDialogOpen(true);
  };

  const handleEditAccount = (item: Account) => {
    setAccountForm({
      id: item.id,
      code: item.code,
      name: item.name,
      normalBalance: item.normalBalance,
      accountCategoryId: item.accountCategory?.id || "",
      isActive: item.isActive,
    });
    setAccountDialogOpen(true);
  };

  const handleViewJournal = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/finance/journals/${id}`);
    const json = await res.json();
    const journal: Journal | null = json.data || null;
    if (!journal) {
      setLoading(false);
      return;
    }

    setJournalForm({
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
    setJournalDialogMode("view");
    setJournalDialogOpen(true);
    setLoading(false);
  };

  const handleEditJournal = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/finance/journals/${id}`);
    const json = await res.json();
    const journal: Journal | null = json.data || null;
    if (!journal) {
      setLoading(false);
      return;
    }

    setJournalForm({
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
    setJournalDialogMode("edit");
    setJournalDialogOpen(true);
    setLoading(false);
  };

  const handleEditPartner = async (id: string) => {
    setLoading(true);
    const endpoint = mode === "customers" ? "/api/finance/customers" : "/api/finance/vendors";
    const res = await fetch(`${endpoint}?page=1&limit=100`);
    const json: PaginatedResponse<Partner> = await res.json();
    const partner = json.data?.find((item) => item.id === id);
    if (!partner) {
      setLoading(false);
      return;
    }
    setPartnerForm({
      id: partner.id,
      code: partner.code,
      name: partner.name,
      phone: partner.phone || "",
      email: partner.email || "",
      address: partner.address || "",
    });
    setPartnerDialogOpen(true);
    setLoading(false);
  };

  const handleAddJournalDetail = () => {
    setJournalForm((current) => ({
      ...current,
      details: [...current.details, emptyJournalDetail()],
    }));
  };

  const handleRemoveJournalDetail = (index: number) => {
    setJournalForm((current) => ({
      ...current,
      details: current.details.filter((_, detailIndex) => detailIndex !== index),
    }));
  };

  const handleChangeJournalDetail = (index: number, detail: JournalDetail) => {
    setJournalForm((current) => ({
      ...current,
      details: current.details.map((item, detailIndex) => (detailIndex === index ? detail : item)),
    }));
  };

  const handleDelete = async (type: "category" | "account" | "journal" | "partner", id: string) => {
    const endpoint =
      type === "category"
        ? `/api/finance/account-categories/${id}`
        : type === "account"
          ? `/api/finance/accounts/${id}`
          : type === "journal"
            ? `/api/finance/journals/${id}`
            : mode === "customers"
              ? `/api/finance/customers/${id}`
              : `/api/finance/vendors/${id}`;

    await fetch(endpoint, { method: "DELETE" });
    setOpenPopoverId(null);
    await loadData();
    if (type === "category") {
      await fetchCategoriesOptions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                if (mode === "categories") {
                  setCategoryDialogOpen(true);
                  return;
                }

                if (mode === "accounts") {
                  setAccountDialogOpen(true);
                  return;
                }

                if (mode === "customers" || mode === "vendors") {
                  setPartnerForm({
                    id: "",
                    code: "",
                    name: "",
                    phone: "",
                    email: "",
                    address: "",
                  });
                  setPartnerDialogOpen(true);
                  return;
                }

                setJournalDialogMode("create");
                setJournalForm({
                  id: "",
                  journalNo: "",
                  date: getTodayInputValue(),
                  referenceNo: "",
                  description: "",
                  status: "DRAFT",
                  details: [emptyJournalDetail()],
                });
                setJournalDialogOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </Button>

          </div>

          <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {mode === "accounts" && (
              <Button
                variant="outline"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`relative flex items-center gap-2 px-4 py-2 ${showFilterPanel
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
            )}

            {mode === "journals" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full pl-4 pr-8 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">DRAFT</SelectItem>
                    <SelectItem value="posted">POSTED</SelectItem>
                    <SelectItem value="void">VOID</SelectItem>
                  </>
                </SelectContent>
              </Select>
            )}

            {(mode === "customers" || mode === "vendors") && (
              <></>
            )}

          </div>
        </div>

        {mode === "accounts" && showFilterPanel && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Filter Data Akun
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAccountFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Hapus Semua Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Kategori Akun
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Kategori</option>
                  {categoryOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Pencarian: {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Kategori:{" "}
                    {categoryOptions.find((item) => item.id === categoryFilter)?.name || categoryFilter}
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Status: {statusFilter === "active" ? "Aktif" : "Tidak Aktif"}
                    <button
                      onClick={() => setStatusFilter("all")}
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

        <div
          className={`overflow-x-auto transition-opacity duration-200 ${loading ? "opacity-70" : ""} mt-6`}
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b dark:border-gray-700">
                {mode === "categories" && (
                  <>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Code</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Nama</TableHead>
                    {checkRoleMulti("finance", ["update", "delete"]) && (
                      <TableHead className="text-right p-3 font-semibold dark:text-gray-300">Aksi</TableHead>
                    )}
                  </>
                )}
                {mode === "accounts" && (
                  <>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Code</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Nama</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Kategori</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Saldo Normal</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Status</TableHead>
                    {checkRoleMulti("finance", ["update", "delete"]) && (
                      <TableHead className="text-right p-3 font-semibold dark:text-gray-300">Aksi</TableHead>
                    )}
                  </>
                )}
                {mode === "journals" && (
                  <>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">No Jurnal</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Tanggal</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Referensi</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Deskripsi</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Nominal</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Status</TableHead>
                    {(checkRole("finance", "get-by-id") || checkRole("finance", "delete")) && (
                      <TableHead className="text-right p-3 font-semibold dark:text-gray-300">Aksi</TableHead>
                    )}
                  </>
                )}
                {(mode === "customers" || mode === "vendors") && (
                  <>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Code</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Nama</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Telepon</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Email</TableHead>
                    <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Alamat</TableHead>
                    {(checkRole("finance", "update") || checkRole("finance", "delete")) && (
                      <TableHead className="text-right p-3 font-semibold dark:text-gray-300">Aksi</TableHead>
                    )}
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                ((mode === "categories" && categories.length === 0) ||
                  (mode === "accounts" && accounts.length === 0) ||
                  (mode === "journals" && journals.length === 0) ||
                  ((mode === "customers" || mode === "vendors") && partners.length === 0)) ? (
                <TableRow>
                  <TableCell
                    colSpan={mode === "categories" ? 3 : mode === "accounts" ? 6 : 6}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                      <span>Memuat data finance...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : mode === "categories" ? (
                categories.length > 0 ? (
                  categories.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="p-3 font-medium dark:text-white">{item.code}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.name}</TableCell>
                      {checkRoleMulti("finance", ["update", "delete"]) && (
                        <TableCell className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            {checkRole("finance", "update") && (
                              <button
                                type="button"
                                onClick={() => handleEditCategory(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit kategori akun"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {checkRole("finance", "delete") && (
                              <Popover
                                open={openPopoverId === item.id}
                                onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? item.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 space-y-3">
                                  <p className="text-sm">Yakin ingin menghapus kategori ini?</p>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setOpenPopoverId(null)}>
                                      Batal
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete("category", item.id)}>
                                      Hapus
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={checkRoleMulti("finance", ["update", "delete"]) ? 3 : 2} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data yang cocok.
                    </TableCell>
                  </TableRow>
                )
              ) : mode === "accounts" ? (
                accounts.length > 0 ? (
                  accounts.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="p-3 font-medium dark:text-white">{item.code}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.name}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.accountCategory?.name || "-"}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.normalBalance}</TableCell>
                      <TableCell className="p-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${item.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      {checkRoleMulti("finance", ["update", "delete"]) && (
                        <TableCell className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            {checkRole("finance", "update") && (
                              <button
                                type="button"
                                onClick={() => handleEditAccount(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit akun"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {checkRole("finance", "delete") && (
                              <Popover
                                open={openPopoverId === item.id}
                                onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? item.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 space-y-3">
                                  <p className="text-sm">Yakin ingin menghapus akun ini?</p>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setOpenPopoverId(null)}>
                                      Batal
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete("account", item.id)}>
                                      Hapus
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={checkRoleMulti("finance", ["update", "delete"]) ? 6 : 5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data yang cocok.
                    </TableCell>
                  </TableRow>
                )
              ) : mode === "customers" || mode === "vendors" ? (
                partners.length > 0 ? (
                  partners.map((item) => (
                    <TableRow key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="p-3 font-medium dark:text-white">{item.code}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.name}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.phone || "-"}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.email || "-"}</TableCell>
                      <TableCell className="p-3 dark:text-gray-300">{item.address || "-"}</TableCell>
                      {(checkRole("finance", "update") || checkRole("finance", "delete")) && (
                        <TableCell className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            {checkRole("finance", "update") && (
                              <button type="button" onClick={() => handleEditPartner(item.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {checkRole("finance", "delete") && (
                              <Popover open={openPopoverId === item.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? item.id : null)}>
                                <PopoverTrigger asChild>
                                  <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 space-y-3">
                                  <p className="text-sm">Yakin ingin menghapus data ini?</p>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setOpenPopoverId(null)}>Batal</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete("partner", item.id)}>Hapus</Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={checkRole("finance", "update") || checkRole("finance", "delete") ? 6 : 5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data yang cocok.
                    </TableCell>
                  </TableRow>
                )
              ) : journals.length > 0 ? (
                journals.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="p-3 font-medium dark:text-white">{item.journalNo}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">
                      {formatJournalDate(item.date)}
                    </TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{item.referenceNo || "-"}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{item.description || "-"}</TableCell>
                    <TableCell className="p-3 font-medium dark:text-white">
                      Rp {getJournalNominal(item.details).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="p-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${item.status === "POSTED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : item.status === "VOID"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    {(checkRole("finance", "get-by-id") || checkRole("finance", "update") || checkRole("finance", "delete")) && (
                      <TableCell className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {checkRole("finance", "get-by-id") && (
                            <button
                              type="button"
                              onClick={() => handleViewJournal(item.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Lihat detail jurnal"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {checkRole("finance", "update") ? (
                            <button
                              type="button"
                              onClick={() => handleEditJournal(item.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit jurnal"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          ) : null}
                          {checkRole("finance", "delete") && (
                            <Popover
                              open={openPopoverId === item.id}
                              onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? item.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">Yakin ingin menghapus jurnal ini?</p>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setOpenPopoverId(null)}>
                                    Batal
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDelete("journal", item.id)}>
                                    Hapus
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={checkRole("finance", "get-by-id") || checkRole("finance", "update") || checkRole("finance", "delete") ? 7 : 6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {mode === "categories" ? categories.length : mode === "accounts" ? accounts.length : journals.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{total}</span>{" "}
            {title.toLowerCase()}
            {totalPages > 0 && <span> — Halaman {currentPage} dari {totalPages}</span>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {visiblePages.map((page, idx) =>
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
                      onClick={() => setCurrentPage(page)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        loading={loading}
        form={categoryForm}
        onOpenChange={setCategoryDialogOpen}
        onChange={setCategoryForm}
        onSubmit={saveCategory}
      />

      <AccountDialog
        open={accountDialogOpen}
        loading={loading}
        categories={categoryOptions}
        form={accountForm}
        onOpenChange={setAccountDialogOpen}
        onChange={setAccountForm}
        onSubmit={saveAccount}
      />

      <JournalDialog
        open={journalDialogOpen}
        loading={loading}
        readOnly={journalDialogMode === "view"}
        accountOptions={accountOptions}
        customerOptions={customerOptions}
        vendorOptions={vendorOptions}
        form={journalForm}
        onOpenChange={setJournalDialogOpen}
        onChange={setJournalForm}
        onSubmit={saveJournal}
        onAddDetail={handleAddJournalDetail}
        onRemoveDetail={handleRemoveJournalDetail}
        onChangeDetail={handleChangeJournalDetail}
      />

      {(mode === "customers" || mode === "vendors") && (
        <PartnerDialog
          open={partnerDialogOpen}
          loading={loading}
          title={mode === "customers" ? "Kelola Customer" : "Kelola Vendor"}
          description={mode === "customers" ? "Tambah customer untuk data finance." : "Tambah vendor untuk data finance."}
          form={partnerForm}
          onOpenChange={setPartnerDialogOpen}
          onChange={setPartnerForm}
          onSubmit={savePartner}
        />
      )}
    </div>
  );
}
