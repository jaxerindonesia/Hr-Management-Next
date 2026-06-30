"use client";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountCategory, AccountFormState } from "./types";

type Props = {
  open: boolean;
  loading: boolean;
  categories: AccountCategory[];
  form: AccountFormState;
  onOpenChange: (open: boolean) => void;
  onChange: (form: AccountFormState) => void;
  onSubmit: () => void;
};

export default function AccountDialog({
  open,
  loading,
  categories,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Akun</DialogTitle>
          <DialogDescription>Data akun keuangan</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Kode</Label>
              <Input
                value={form.code}
                onChange={(e) => onChange({ ...form, code: e.target.value })}
                placeholder="Mis. 1101"
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                placeholder="Mis. Kas Kecil"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Kategori</Label>
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
              <Label>Saldo Normal</Label>
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
