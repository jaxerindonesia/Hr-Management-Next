"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FinanceLedgerRow } from "../types";
import { fetchFinanceLedger } from "../actions";

type Props = {
  accounts: Array<{
    id: string;
    code: string;
    name: string;
  }>;
};

export default function LedgerPage({ accounts }: Props) {
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<FinanceLedgerRow[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const params = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", "1");
    query.set("limit", "200");
    if (search) query.set("search", search);
    if (accountId !== "all") query.set("accountId", accountId);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    return query;
  }, [accountId, from, search, to]);

  useEffect(() => {
    let alive = true;
    void fetchFinanceLedger(params).then((json) => {
      if (alive) setRows(json.data);
    });

    return () => {
      alive = false;
    };
  }, [params]);

  const activeFilterCount = [search !== "", accountId !== "all", from !== "", to !== ""].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setAccountId("all");
    setFrom("");
    setTo("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari jurnal, akun, atau deskripsi..."
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`relative flex items-center gap-2 px-4 py-2 transition-colors ${
              showFilterPanel || activeFilterCount > 0
                ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
        {showFilterPanel && (
          <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Filter Data Buku Besar</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Saring berdasarkan akun dan periode.</p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  <X className="h-4 w-4" />
                  Hapus Semua Filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Akun</label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua akun</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cari</label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari jurnal, akun, atau deskripsi..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Dari</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sampai</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {search && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Cari: {search}
                    <button type="button" onClick={() => setSearch("")} className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {accountId !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Akun: {accounts.find((account) => account.id === accountId)?.code ?? "Semua"}
                    <button type="button" onClick={() => setAccountId("all")} className="rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {from && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    Dari: {from}
                    <button type="button" onClick={() => setFrom("")} className="rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {to && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    Sampai: {to}
                    <button type="button" onClick={() => setTo("")} className="rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        <div className="overflow-x-auto mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No Jurnal</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                    Belum ada data buku besar.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={`${row.journalNo}-${row.accountId}-${index}`}>
                    <TableCell>{new Date(row.journalDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{row.journalNo}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">{row.accountCode}</div>
                      <div className="text-xs text-gray-500">{row.accountName}</div>
                    </TableCell>
                    <TableCell className={row.debit > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-gray-500"}>
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className={row.credit > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-gray-500"}>
                      {formatCurrency(row.credit)}
                    </TableCell>
                    <TableCell className={row.balance >= 0 ? "font-medium text-gray-900 dark:text-white" : "font-medium text-red-600 dark:text-red-400"}>
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
