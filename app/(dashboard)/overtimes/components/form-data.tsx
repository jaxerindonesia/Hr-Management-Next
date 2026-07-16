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
import { formatDateInputValue, formatTimeInputValue } from "@/lib/helper/date";
import { INITIAL_FORM_DATA } from "../page.config";

export default function FormData({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialData?: OvertimeDto;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OvertimeDto>(INITIAL_FORM_DATA);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const dateValue = formData.overtimeDate;
      const startTimeValue = formData.startTime;
      const endTimeValue = formData.endTime;

      const payload = {
        ...formData,
        overtimeDate: dateValue,
        startTime: startTimeValue,
        endTime: endTimeValue,
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

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      setFormData(INITIAL_FORM_DATA);
      return;
    }

    setFormData({
      ...INITIAL_FORM_DATA,
      ...initialData,
      overtimeDate: formatDateInputValue(initialData.overtimeDate),
      startTime: formatTimeInputValue(initialData.startTime),
      endTime: formatTimeInputValue(initialData.endTime),
      description: initialData.description ?? "",
      approvalDecisions: initialData.approvalDecisions ?? [],
    });
  }, [initialData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Pengajuan Lembur" : "Tambah Pengajuan Lembur"}
          </DialogTitle>
          <DialogDescription>
            {formData.id
              ? "Perbarui detail pengajuan lembur yang masih dapat diubah."
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
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    overtimeDate: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(event) => 
                    setFormData((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  required
                />
              </div>
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
                placeholder="Tuliskan alasan lembur"
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
