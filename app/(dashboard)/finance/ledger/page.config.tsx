"use client";

import { Filter, X } from "lucide-react";
import type React from "react";
import type { DefaultColumnFormat } from "@/components/dynamic-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FinanceLedgerRowDto } from "@/lib/dto/finance";
import { formatCurrency } from "@/lib/helper/format-currency";

type LedgerAccountOption = {
  id: string;
  code: string;
  name: string;
};

interface HeaderToolbarProps {
  filters: {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    activeCount: number;
    clear: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    accountId: string;
    setAccountId: React.Dispatch<React.SetStateAction<string>>;
    from: string;
    setFrom: React.Dispatch<React.SetStateAction<string>>;
    to: string;
    setTo: React.Dispatch<React.SetStateAction<string>>;
    accounts: LedgerAccountOption[];
  };
}

export const columnFormats: DefaultColumnFormat<FinanceLedgerRowDto>[] = [
  {
    key: "journalDate",
    title: "Tanggal",
    textClassName: "text-slate-700 dark:text-slate-200",
    formatter: (value) => (value ? new Date(String(value)).toLocaleDateString("id-ID") : "-"),
  },
  {
    key: "journalNo",
    title: "No Jurnal",
    textClassName: "font-medium text-slate-900 dark:text-slate-100",
    formatter: (value) => String(value || "-"),
  },
  {
    key: "accountCode",
    title: "Akun",
    textClassName: "whitespace-normal",
    formatter: (_value, row) => (
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{row.accountCode}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{row.accountName}</div>
      </div>
    ),
  },
  {
    key: "debit",
    title: "Debit",
    formatter: (value) => (
      <span className={Number(value) > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}>
        {formatCurrency(Number(value || 0))}
      </span>
    ),
  },
  {
    key: "credit",
    title: "Credit",
    formatter: (value) => (
      <span className={Number(value) > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}>
        {formatCurrency(Number(value || 0))}
      </span>
    ),
  },
  {
    key: "balance",
    title: "Saldo",
    formatter: (value) => (
      <span className={Number(value) >= 0 ? "font-medium text-gray-900 dark:text-white" : "font-medium text-red-600 dark:text-red-400"}>
        {formatCurrency(Number(value || 0))}
      </span>
    ),
  },
];

export function headerToolbar({ filters }: HeaderToolbarProps) {
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => filters.setShow(!filters.show)}
          className={`relative flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
            filters.show || filters.activeCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              : "border-gray-300 text-slate-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter
          {filters.activeCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {filters.activeCount}
            </span>
          )}
        </Button>
      </div>

      {filters.show && (
        <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Filter Data Buku Besar</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saring berdasarkan akun dan periode.</p>
            </div>
            {filters.activeCount > 0 && (
              <button
                type="button"
                onClick={filters.clear}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                <X className="h-4 w-4" />
                Hapus Semua Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Akun</Label>
              <Select value={filters.accountId} onValueChange={filters.setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua akun</SelectItem>
                  {filters.accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cari</Label>
              <Input
                value={filters.searchTerm}
                onChange={(event) => filters.setSearchTerm(event.target.value)}
                placeholder="Cari jurnal, akun, atau deskripsi..."
                className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Dari</Label>
              <Input type="date" value={filters.from} onChange={(event) => filters.setFrom(event.target.value)} className="w-full" />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sampai</Label>
              <Input type="date" value={filters.to} onChange={(event) => filters.setTo(event.target.value)} className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
