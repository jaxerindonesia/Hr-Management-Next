"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import type { OvertimeDto } from "@/lib/dto/overtime";
import { formatDateInputValue } from "@/lib/helper/date";
import { INITIAL_FORM_DATA } from "../page.config";

function getTodayJakartaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function FormData({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialData?: OvertimeDto;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OvertimeDto>(INITIAL_FORM_DATA);
  const minOvertimeDate = getTodayJakartaDate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    try {
      const payload = {
        userId: formData.userId,
        overtimeDate: formData.overtimeDate,
        description: formData.description,
      };

      const url = formData.id
        ? `/api/overtimes/${formData.id}`
        : "/api/overtimes/request";
      const method = formData.id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || "Gagal menyimpan data lembur");
      }

      toast.success(
        `Data lembur berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );

      await onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!initialData) {
      setFormData(INITIAL_FORM_DATA);
      return;
    }

      setFormData({
      ...INITIAL_FORM_DATA,
      ...initialData,
      overtimeDate: formatDateInputValue(initialData.overtimeDate),
      description: initialData.description ?? "",
      approvalDecisions: initialData.approvalDecisions ?? [],
    });
  }, [initialData, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Pengajuan Lembur" : "Tambah Pengajuan Lembur"}
          </DialogTitle>
          <DialogDescription>
            {formData.id
              ? "Perbarui detail pengajuan lembur sebelum proses check in dimulai."
              : "Lengkapi form untuk membuat pengajuan lembur baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tanggal Lembur</Label>
              <Input
                type="date"
                value={formData.overtimeDate}
                min={minOvertimeDate}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    overtimeDate: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Keterangan</Label>
              <Textarea
                value={formData.description ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Tuliskan kegiatan atau alasan lembur"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
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
