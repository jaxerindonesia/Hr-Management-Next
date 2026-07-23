"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { OvertimeDto } from "@/lib/dto/overtime";
import { toast } from "sonner";

export default function CheckoutModal({
  isOpen,
  overtime,
  loading,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  overtime?: OvertimeDto;
  loading: boolean;
  onClose: () => void;
  onSubmit: (file: File | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung");
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }
    setPreviewUrl("pdf");
  };

  const removeFile = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isPdf = previewUrl === "pdf";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Check Out Lembur</DialogTitle>
          <DialogDescription>
            Upload bukti lembur sebelum melakukan check out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
            <p className="font-medium">{overtime?.description || "Pengajuan lembur"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tanggal lembur: {overtime?.overtimeDate ? new Date(overtime.overtimeDate).toLocaleDateString("id-ID") : "-"}
            </p>
          </div>

          <div className="grid gap-3">
            <Label>Bukti Lembur</Label>

            {!previewUrl ? (
              <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed">
                <Upload className="h-6 w-6 text-gray-500" />
                <p className="text-sm text-gray-500">
                  JPG, PNG, PDF (Maks. 5MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border">
                {!isPdf ? (
                  <img
                    src={previewUrl}
                    alt="Preview bukti lembur"
                    className="max-h-64 w-full object-contain p-4"
                  />
                ) : (
                  <div className="flex items-center gap-4 p-6">
                    <FileText className="h-8 w-8 text-red-500" />
                    <p className="text-sm font-semibold">
                      {selectedFile?.name || "Dokumen PDF siap dikirim"}
                    </p>
                  </div>
                )}

                <div className="flex justify-between bg-gray-50 p-4 dark:bg-slate-900/40">
                  <label className="cursor-pointer text-xs">
                    Ganti File
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-xs text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={() => onSubmit(selectedFile)}
            >
              {loading ? "Memproses..." : "Lanjut Check Out"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
