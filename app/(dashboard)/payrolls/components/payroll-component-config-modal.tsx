"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PayrollComponentConfigDto } from "@/lib/dto/payroll-component";
import { parseApiError } from "@/lib/helper/response-api";

function createEmptyComponent(sortOrder: number): PayrollComponentConfigDto {
  return {
    name: "",
    type: "DEDUCTION",
    inputType: "MANUAL",
    defaultValue: 0,
    isActive: true,
    sortOrder,
  };
}

export default function PayrollComponentConfigModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [items, setItems] = useState<PayrollComponentConfigDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll-component-config");
      if (!res.ok) {
        throw new Error(
          await parseApiError(res, "Gagal memuat komponen payroll"),
        );
      }
      const json = await res.json();
      const nextItems = Array.isArray(json.data) ? json.data : [];
      setItems(
        nextItems.length > 0
          ? nextItems.map((item: PayrollComponentConfigDto, index: number) => ({
              ...item,
              sortOrder: Number(item.sortOrder ?? index + 1),
              defaultValue: Number(item.defaultValue ?? 0),
              isActive: Boolean(item.isActive ?? true),
            }))
          : [createEmptyComponent(1)],
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat komponen payroll",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchConfig();
  }, [isOpen]);

  const updateItem = (index: number, patch: Partial<PayrollComponentConfigDto>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createEmptyComponent(current.length + 1)]);
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 })),
    );
  };

  const save = async () => {
    if (items.length === 0) {
      toast.error("Minimal tambahkan 1 komponen payroll");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        items: items.map((item, index) => ({
          ...item,
          name: String(item.name || "").trim(),
          defaultValue: Number(item.defaultValue || 0),
          sortOrder: index + 1,
        })),
      };

      const res = await fetch("/api/payroll-component-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          await parseApiError(res, "Gagal menyimpan komponen payroll"),
        );
      }

      toast.success("Komponen payroll berhasil disimpan");
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan komponen payroll",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[calc(100vw-6rem)] !max-w-[1200px] max-h-[90vh] overflow-y-auto px-8">
        <DialogHeader>
          <DialogTitle>Kelola Komponen Payroll</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Atur komponen payroll yang akan otomatis muncul saat proses gaji. Komponen bisa bertipe <span className="font-medium text-slate-900">penghasilan</span> atau <span className="font-medium text-slate-900">potongan</span>.
            </p>
            <p>
              <span className="font-medium text-slate-900"> * Manual</span>:
              nilai komponen diisi langsung saat membuat payroll, sehingga nominalnya bisa berbeda tiap karyawan atau periode.
            </p>
            <p>
              <span className="font-medium text-slate-900">* Nominal Tetap</span>:
              sistem otomatis mengisi nominal tetap dari konfigurasi ini ke payroll.
            </p>
            <p>
              <span className="font-medium text-slate-900">* Persentase</span>:
              sistem menghitung nominal otomatis berdasarkan persentase dari gaji pokok.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Memuat komponen payroll...
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || `component-${index}`}
                  className="grid gap-4 rounded-xl border p-4 md:grid-cols-[minmax(360px,3.4fr)_140px_180px_180px_56px] md:items-end"
                >
                  <div className="grid min-w-0 gap-2">
                    <Label>Nama Komponen</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, { name: e.target.value })}
                      placeholder="Contoh: BPJS Kesehatan"
                    />
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <Label>Tipe</Label>
                    <Select
                      value={item.type}
                      onValueChange={(value: "EARNING" | "DEDUCTION") =>
                        updateItem(index, { type: value })
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EARNING">Penghasilan</SelectItem>
                        <SelectItem value="DEDUCTION">Potongan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <Label>Metode</Label>
                    <Select
                      value={item.inputType}
                      onValueChange={(value: "FIXED" | "PERCENTAGE" | "MANUAL") =>
                        updateItem(index, { inputType: value })
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="FIXED">Nominal Tetap</SelectItem>
                        <SelectItem value="PERCENTAGE">Persentase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <Label>{item.inputType === "PERCENTAGE" ? "Persentase (%)" : "Nominal (Rp)"}</Label>
                    <Input
                      type={item.inputType === "PERCENTAGE" ? "number" : "text"}
                      min={item.inputType === "PERCENTAGE" ? 0 : undefined}
                      value={
                        item.inputType === "PERCENTAGE"
                          ? (item.defaultValue ?? 0)
                          : item.defaultValue
                            ? Number(item.defaultValue).toLocaleString("id-ID")
                            : ""
                      }
                      onChange={(e) =>
                        updateItem(index, {
                          defaultValue:
                            item.inputType === "PERCENTAGE"
                              ? Number(e.target.value || 0)
                              : Number(e.target.value.replace(/\D/g, "") || 0),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="flex min-w-0 items-end justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-red-600"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Komponen
          </Button>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="button" disabled={saving} onClick={save}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
