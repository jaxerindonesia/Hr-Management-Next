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
import { UserDto } from "@/lib/dto/user";

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

export default function PettyCashFormData({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData?: PettyCashDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [userData, setUserData] = useState({ id: "", role: "" });

  const [formData, setFormData] = useState<PettyCashDto>(
    initialData || {
      userId: "",
      purpose: "",
      category: "",
      amount: 0,
      transferDate: null,
      bankName: "",
      accountNumber: "",
      status: "PENDING",
    },
  );

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setEmployees(json.data || []);
    } catch {
      toast.error("Gagal memuat data karyawan");
    }
  };

  useEffect(() => {
    fetchEmployees();
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

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

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success(
        `Petty Cash berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );

      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan petty cash");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Petty Cash" : "Buat Petty Cash Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Karyawan */}
          <div className="space-y-2">
            <Label htmlFor="userId">Karyawan Penerima</Label>
            <Select
              value={formData.userId}
              onValueChange={(val) => setFormData({ ...formData, userId: val })}
              disabled={!!formData.id}
            >
              <SelectTrigger id="userId" className="w-full">
                <SelectValue placeholder="Pilih Karyawan" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id || ""}>
                    {emp.name} {emp.position ? `(${emp.position})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : formData.id ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
