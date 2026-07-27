"use client";

import { PettyCashDto } from "@/lib/dto/petty-cash";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseApiError } from "@/lib/helper/response-api";
import EmployeeSearchSelect from "@/components/employee-search-select";

const CATEGORIES = [
  "Operasional",
  "Transportasi",
  "Konsumsi",
  "Kesehatan",
  "Lainnya",
];

const STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "TRANSFER", label: "Transfered" },
  { value: "SETTLE", label: "Settled (Done)" },
];

const createDefaultFormData = (): PettyCashDto => ({
  userId: "",
  purpose: "",
  category: "",
  amount: 0,
  transferDate: null,
  bankName: "",
  accountNumber: "",
  status: "PENDING",
});

export default function PettyCashFormData({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialData?: PettyCashDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PettyCashDto>(createDefaultFormData());

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialData ? { ...initialData } : createDefaultFormData());
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = formData.id
        ? `/api/pettycash/${formData.id}`
        : "/api/pettycash";

      const res = await fetch(url, {
        method: formData.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Gagal menyimpan data"));
      }

      toast.success(
        `Petty Cash berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );

      setFormData(createDefaultFormData());
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan petty cash",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Petty Cash" : "Buat Petty Cash Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Karyawan */}
          <div className="space-y-2">
            <Label htmlFor="userId">Karyawan Penerima</Label>
            <EmployeeSearchSelect
              value={formData.userId}
              onChange={(val) => setFormData({ ...formData, userId: val })}
              disabled={!!formData.id}
              placeholder="Pilih Karyawan"
            />
          </div>

          {/* Tujuan */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Tujuan Penggunaan</Label>
            <Input
              id="purpose"
              placeholder="Contoh: Dana operasional tim marketing"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
            />
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nominal */}
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal Dana (Rp)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0"
              value={formData.amount ? formData.amount.toLocaleString("id-ID") : ""}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");
                setFormData({ ...formData, amount: Number(numericValue) });
              }}
              required
            />
          </div>

          {/* Bank & Rekening */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Tujuan</Label>
              <Input
                id="bankName"
                placeholder="Contoh: BCA / Mandiri"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">No. Rekening</Label>
              <Input
                id="accountNumber"
                placeholder="Nomor Rekening"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Tanggal Transfer & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transferDate">Tanggal Ditransfer</Label>
              <Input
                id="transferDate"
                type="date"
                value={
                  formData.transferDate
                    ? new Date(formData.transferDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transferDate: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Menyimpan..." : formData.id ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
