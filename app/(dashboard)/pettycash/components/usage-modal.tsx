"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

export default function PettyCashUsageModal({
  isOpen,
  pettyCashId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  pettyCashId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [usageDate, setUsageDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("pdf");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !usageDate) {
      toast.error("Semua field wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("description", description);
      fd.append("amount", String(amount));
      fd.append("usageDate", usageDate);
      if (selectedFile) {
        fd.append("file", selectedFile);
      }

      const res = await fetch(`/api/pettycash/${pettyCashId}/usage`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal melaporkan penggunaan");
      }

      toast.success("Laporan penggunaan petty cash berhasil dikirim!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const isPdf = previewUrl === "pdf";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Lapor Penggunaan Petty Cash</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Digunakan Untuk Apa */}
          <div className="space-y-2">
            <Label htmlFor="description">Digunakan Untuk Apa?</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail penggunaan dana..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Nominal */}
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal Pengeluaran (Rp)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0"
              value={amount ? amount.toLocaleString("id-ID") : ""}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");
                setAmount(Number(numericValue));
              }}
              required
            />
          </div>

          {/* Tanggal Digunakan */}
          <div className="space-y-2">
            <Label htmlFor="usageDate">Tanggal Digunakan</Label>
            <Input
              id="usageDate"
              type="date"
              value={usageDate}
              onChange={(e) => setUsageDate(e.target.value)}
              required
            />
          </div>

          {/* Bukti Pengeluaran */}
          <div className="space-y-2">
            <Label>Bukti Pengeluaran (Nota / Struk)</Label>
            {!previewUrl ? (
              <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 text-center hover:bg-gray-50/50">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">
                  JPG, PNG, WebP, PDF (Maks. 5MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative border rounded-xl overflow-hidden bg-gray-50/20">
                {!isPdf ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-40 object-contain p-2"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <FileText className="w-6 h-6 text-red-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      Dokumen PDF Siap Dikirim
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-2 border-t bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs font-medium text-blue-600 cursor-pointer">
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
                    onClick={removeFile}
                    className="text-xs font-medium text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
