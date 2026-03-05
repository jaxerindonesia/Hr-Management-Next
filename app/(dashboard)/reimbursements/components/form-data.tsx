"use client";

import { ReimbursementDto } from "@/lib/dto/reimbursement";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDto } from "@/lib/dto/user";
import { Upload, FileText } from "lucide-react";

const CATEGORIES = [
  "Transportasi",
  "Akomodasi",
  "Makan & Minum",
  "Kesehatan",
  "Peralatan Kerja",
  "Komunikasi",
  "Lainnya",
];

export default function ReimbursementFormData({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData?: ReimbursementDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.receiptUrl ?? null,
  );
  const [isReceiptRemoved, setIsReceiptRemoved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ReimbursementDto>(
    initialData || {
      userId: "",
      title: "",
      category: "",
      amount: 0,
      date: "",
      description: "",
      receiptUrl: null,
      status: "pending",
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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung");
      return;
    }

    // revoke old blob if exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setIsReceiptRemoved(false);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("pdf");
    }
  };

  const removeReceipt = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setIsReceiptRemoved(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();

      fd.append("userId", formData.userId || "");
      fd.append("title", formData.title);
      fd.append("category", formData.category);
      fd.append("amount", String(formData.amount));
      fd.append("date", formData.date);
      fd.append("description", formData.description || "");
      fd.append("status", formData.status || "pending");

      if (formData.id) {
        fd.append("id", formData.id);
      }

      if (selectedFile) {
        fd.append("file", selectedFile);
      }

      if (isReceiptRemoved && !selectedFile) {
        fd.append("removeReceipt", "true");
      }

      const url = formData.id
        ? `/api/reimbursements/${formData.id}`
        : "/api/reimbursements";

      const res = await fetch(url, {
        method: formData.id ? "PUT" : "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success(
        `Reimbursement berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );

      onSuccess();
      onClose();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const isPdf =
    previewUrl === "pdf" ||
    (!selectedFile && formData.receiptUrl?.toLowerCase().endsWith(".pdf"));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Reimbursement" : "Tambah Reimbursement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Karyawan */}
            <div className="grid gap-2">
              <Label>Nama Karyawan</Label>
              <Select
                value={formData.userId || ""}
                onValueChange={(val) =>
                  setFormData({ ...formData, userId: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id || ""}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Judul */}
            <div className="grid gap-2">
              <Label>Judul Klaim</Label>
              <Input
                placeholder="Contoh: Biaya Makan Dinas Jakarta"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Kategori */}
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger className="w-full">
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

            {/* Nominal & Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nominal (Rp)</Label>
                <Input
                  type="text"
                  placeholder="0"
                  value={
                    formData.amount
                      ? formData.amount.toLocaleString("id-ID")
                      : ""
                  }
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setFormData({
                      ...formData,
                      amount: Number(numericValue),
                    });
                  }}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Tanggal Pengeluaran</Label>
                <Input
                  type="date"
                  value={
                    formData.date
                      ? new Date(formData.date).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="grid gap-2">
              <Label>Keterangan (opsional)</Label>
              <Textarea
                placeholder="Deskripsikan klaim reimbursement Anda secara singkat"
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            {/* Upload */}
            <div className="grid gap-3">
              <Label>Upload Struk / Bukti Pembayaran</Label>

              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer">
                  <Upload className="w-6 h-6 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    JPG, PNG, WebP, PDF (Maks. 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative border rounded-2xl overflow-hidden">
                  {!isPdf ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-contain p-4"
                    />
                  ) : (
                    <div className="flex items-center gap-4 p-6">
                      <FileText className="w-8 h-8 text-red-500" />
                      <p className="text-sm font-semibold">
                        Dokumen PDF siap dikirim
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between p-4 bg-gray-50">
                    <label className="text-xs cursor-pointer">
                      Ganti File
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="text-xs text-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
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
