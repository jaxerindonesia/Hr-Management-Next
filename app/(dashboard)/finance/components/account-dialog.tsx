"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronsUpDown, Search } from "lucide-react";
import { Account, AccountCategory, AccountFormState } from "../types";

type Props = {
  open: boolean;
  loading: boolean;
  categories: AccountCategory[];
  accounts: Account[];
  form: AccountFormState;
  onOpenChange: (open: boolean) => void;
  onChange: (form: AccountFormState) => void;
  onSubmit: () => void;
};

export default function AccountDialog({
  open,
  loading,
  categories,
  accounts,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: Props) {
  const dialogTitle = form.id ? "Edit Akun" : "Tambah Akun";
  const [parentSearch, setParentSearch] = useState("");
  const [parentOpen, setParentOpen] = useState(false);
  const selectedParent = accounts.find((item) => item.id === form.parentId);

  const parentAccounts = useMemo(() => {
    const query = parentSearch.trim().toLowerCase();

    return accounts
      .filter((item) => item.id !== form.id)
      .filter((item) => {
        if (!query) return true;
        return (
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          `${item.code} - ${item.name}`.toLowerCase().includes(query)
        );
      })
      .slice(0, 5);
  }, [accounts, form.id, parentSearch]);

  useEffect(() => {
    if (!open) {
      setParentOpen(false);
      setParentSearch("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Parent akun dibuat sebagai akun root terlebih dahulu, lalu akun anak memilih parent dari daftar akun yang sudah ada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Kode *</Label>
              <Input
                value={form.code}
                onChange={(e) => onChange({ ...form, code: e.target.value })}
                placeholder="Mis. 1101"
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama *</Label>
              <Input
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                placeholder="Mis. Kas Kecil"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Parent Akun <span className="text-gray-400">(opsional)</span></Label>
            <Popover open={parentOpen} onOpenChange={setParentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between px-3 font-normal"
                >
                  <span className="truncate text-left">
                    {selectedParent ? `${selectedParent.code} - ${selectedParent.name}` : "Tidak ada parent"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(100vw-2rem,32rem)] p-3">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      placeholder="Cari parent akun..."
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        onChange({ ...form, parentId: "" });
                        setParentOpen(false);
                      }}
                    >
                      <span>Tidak ada parent</span>
                      {!form.parentId && <span className="text-xs text-primary">Terpilih</span>}
                    </button>
                    {parentAccounts.length > 0 ? (
                      parentAccounts.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            onChange({ ...form, parentId: item.id });
                            setParentOpen(false);
                          }}
                        >
                          <span className="truncate">
                            {item.code} - {item.name}
                          </span>
                          {form.parentId === item.id && <span className="text-xs text-primary">Terpilih</span>}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada hasil.</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jika belum ada parent, simpan akun ini sebagai root account dulu.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Kategori *</Label>
              <Select
                value={form.accountCategoryId}
                onValueChange={(value) => onChange({ ...form, accountCategoryId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Saldo Normal *</Label>
              <Select
                value={form.normalBalance}
                onValueChange={(value) => onChange({ ...form, normalBalance: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT</SelectItem>
                  <SelectItem value="CREDIT">CREDIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.isActive ? "active" : "inactive"}
                onValueChange={(value) => onChange({ ...form, isActive: value === "active" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {form.id ? "Update" : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
