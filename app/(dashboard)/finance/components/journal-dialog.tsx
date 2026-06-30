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
import { Textarea } from "@/components/ui/textarea";
import { Account, JournalDetail, JournalFormState, Partner } from "../types";

type Props = {
  open: boolean;
  loading: boolean;
  readOnly?: boolean;
  accountOptions: Account[];
  customerOptions: Partner[];
  vendorOptions: Partner[];
  form: JournalFormState;
  onOpenChange: (open: boolean) => void;
  onChange: (form: JournalFormState) => void;
  onSubmit: () => void;
  onGenerateJournalNo: () => void;
  onAddDetail: () => void;
  onRemoveDetail: (index: number) => void;
  onChangeDetail: (index: number, detail: JournalDetail) => void;
};

export default function JournalDialog({
  open,
  loading,
  readOnly = false,
  accountOptions,
  customerOptions,
  vendorOptions,
  form,
  onOpenChange,
  onChange,
  onSubmit,
  onGenerateJournalNo,
  onAddDetail,
  onRemoveDetail,
  onChangeDetail,
}: Props) {
  const totalDebit = form.details.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const totalCredit = form.details.reduce((sum, item) => sum + Number(item.credit || 0), 0);

  const formatRupiahInput = (value: number | string) => {
    const raw = String(value ?? "").replace(/[^\d]/g, "");
    if (!raw) return "";
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseRupiahInput = (value: string) => Number(value.replace(/[^\d]/g, "") || 0);

  const updateDetailRelation = (index: number, value: "none" | "customer" | "vendor") => {
    const current = form.details[index];
    const next: JournalDetail = {
      ...current,
      relationType: value,
      customerId: value === "customer" ? current.customerId : undefined,
      vendorId: value === "vendor" ? current.vendorId : undefined,
    };

    if (value === "none") {
      next.customerId = undefined;
      next.vendorId = undefined;
    }

    onChangeDetail(index, next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{readOnly ? "Detail Jurnal Umum" : form.id ? "Edit Jurnal Umum" : "Tambah Jurnal Umum"}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "Lihat rincian jurnal umum beserta detail debit dan kredit."
              : "Kelola jurnal umum untuk mencatat transaksi keuangan perusahaan."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_0.8fr]">
            <div className="grid gap-2">
              <Label>No Jurnal *</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={form.journalNo}
                  disabled={readOnly}
                  onChange={(e) => onChange({ ...form, journalNo: e.target.value })}
                  placeholder="Mis. JRNL-2026-0001"
                />
                {!readOnly && !form.id && (
                  <Button type="button" variant="outline" onClick={onGenerateJournalNo} disabled={loading} className="shrink-0">
                    Generate
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={form.date}
                disabled={readOnly}
                onChange={(e) => onChange({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                disabled={readOnly}
                value={form.status}
                onValueChange={(value) => onChange({ ...form, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="POSTED">POSTED</SelectItem>
                  <SelectItem value="VOID">VOID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Referensi</Label>
            <Input
              value={form.referenceNo}
              disabled={readOnly}
              onChange={(e) => onChange({ ...form, referenceNo: e.target.value })}
              placeholder="No invoice, bukti transfer, dll"
            />
          </div>
          <div className="grid gap-2">
            <Label>Deskripsi</Label>
            <Textarea
              value={form.description}
              disabled={readOnly}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Deskripsi jurnal umum"
            />
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Detail Jurnal</h3>
              {!readOnly && (
                <Button type="button" variant="outline" onClick={onAddDetail}>
                  Tambah Baris
                </Button>
              )}
            </div>
            {form.details.map((row, idx) => (
              <div key={idx} className="rounded-lg border bg-slate-50/60 p-4 space-y-4 dark:border-gray-700 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-200">#{idx + 1}</p>
                  {!readOnly && form.details.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => onRemoveDetail(idx)}>
                      Hapus Baris
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Akun *</Label>
                    <Select
                      disabled={readOnly}
                      value={row.accountId}
                      onValueChange={(value) => onChangeDetail(idx, { ...row, accountId: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih akun" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code} - {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Pihak Terkait</Label>
                    <Select
                      disabled={readOnly}
                      value={row.relationType || "none"}
                      onValueChange={(value) => updateDetailRelation(idx, value as "none" | "customer" | "vendor")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih pihak terkait" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada pihak</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {row.relationType === "customer" ? (
                    <div className="grid gap-2">
                      <Label>Customer</Label>
                      <Select
                        disabled={readOnly}
                        value={row.customerId || "none"}
                        onValueChange={(value) =>
                          onChangeDetail(idx, {
                            ...row,
                            customerId: value === "none" ? undefined : value,
                            vendorId: undefined,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Pilih customer</SelectItem>
                          {customerOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.code} - {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : row.relationType === "vendor" ? (
                    <div className="grid gap-2">
                      <Label>Vendor</Label>
                      <Select
                        disabled={readOnly}
                        value={row.vendorId || "none"}
                        onValueChange={(value) =>
                          onChangeDetail(idx, {
                            ...row,
                            vendorId: value === "none" ? undefined : value,
                            customerId: undefined,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Pilih vendor</SelectItem>
                          {vendorOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.code} - {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label>Customer / Vendor</Label>
                      <div className="rounded-md border border-dashed px-3 py-2 text-sm text-slate-500 dark:border-gray-600 dark:text-gray-400">
                        Tidak ada customer/vendor
                      </div>
                    </div>
                  )}

                  <div className="xl:col-span-3">
                    <div className="mb-3 rounded-md border border-dashed bg-white p-3 text-xs text-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      Isi salah satu saja: <span className="font-medium text-emerald-700 dark:text-emerald-400">Debit</span> atau{" "}
                      <span className="font-medium text-rose-700 dark:text-rose-400">Credit</span>.
                    </div>
                    <div className="grid grid-cols-1 mb-4 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <Label className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            Debit
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-gray-400">Dipakai saat uang/asset bertambah.</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Masuk
                        </span>
                      </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(row.debit)}
                      disabled={readOnly}
                      onChange={(e) => onChangeDetail(idx, { ...row, debit: parseRupiahInput(e.target.value) })}
                      className="border-emerald-200 focus-visible:ring-emerald-500"
                    />
                    </div>
                    <div className="grid grid-cols-1 mb-4 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <Label className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                            Credit
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-gray-400">Dipakai saat uang/asset berkurang.</p>
                        </div>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                          Keluar
                        </span>
                      </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(row.credit)}
                      disabled={readOnly}
                      onChange={(e) => onChangeDetail(idx, { ...row, credit: parseRupiahInput(e.target.value) })}
                      className="border-rose-200 focus-visible:ring-rose-500"
                    />
                    </div>
                  </div>
                  <div className="xl:col-span-3">
                    <Input
                      placeholder="Deskripsi baris"
                      value={row.description}
                      disabled={readOnly}
                      onChange={(e) => onChangeDetail(idx, { ...row, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="grid gap-3 border-t pt-3 pr-3 text-sm font-medium text-slate-700 md:grid-cols-4">
              <div className="md:col-span-2">Total</div>
              <div className="whitespace-nowrap">Debit: <b>Rp {totalDebit.toLocaleString("id-ID")}</b></div>
              <div className="whitespace-nowrap">Credit: <b>Rp {totalCredit.toLocaleString("id-ID")}</b></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Tutup" : "Batal"}
          </Button>
          {!readOnly && (
            <Button onClick={onSubmit} disabled={loading}>
              {form.id ? "Update Jurnal" : "Simpan Jurnal"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
