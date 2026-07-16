"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicPage from "@/components/dynamic-page";
import type { FinanceLedgerRowDto } from "@/lib/dto/finance";
import { toast } from "sonner";
import { columnFormats, headerToolbar } from "./page.config";

type LedgerAccount = {
  id: string;
  code: string;
  name: string;
};

export default function FinanceLedgerRoute() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<FinanceLedgerRowDto[]>([]);
  const [loading, setLoading] = useState(false);
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

  const toolbar = useMemo(
    () =>
      headerToolbar({
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
    [accountId, accounts, activeFilterCount, from, searchTerm, showFilterPanel, to],
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
