"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AttendanceConfig {
  officeStartTime: string;
  officeEndTime: string;
  lateToleranceMinutes: number;
  workingDays: string[];
}

const defaultConfig: AttendanceConfig = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
  workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
};

const DAY_OPTIONS = [
  { value: "MONDAY", label: "Senin" },
  { value: "TUESDAY", label: "Selasa" },
  { value: "WEDNESDAY", label: "Rabu" },
  { value: "THURSDAY", label: "Kamis" },
  { value: "FRIDAY", label: "Jumat" },
  { value: "SATURDAY", label: "Sabtu" },
  { value: "SUNDAY", label: "Minggu" },
] as const;

export default function ModalAttendanceConfig({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<AttendanceConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/attendance-config");
      const json = await res.json();
      const data = json.data || defaultConfig;
      setForm({
        officeStartTime: data.officeStartTime || defaultConfig.officeStartTime,
        officeEndTime: data.officeEndTime || defaultConfig.officeEndTime,
        lateToleranceMinutes: Number(
          data.lateToleranceMinutes ?? defaultConfig.lateToleranceMinutes,
        ),
        workingDays:
          Array.isArray(data.workingDays) && data.workingDays.length > 0
            ? data.workingDays
            : defaultConfig.workingDays,
      });
    } catch {
      toast.error("Gagal memuat konfigurasi attendance");
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const save = async () => {
    if (!form.officeStartTime || !form.officeEndTime) {
      toast.error("Jam masuk dan jam pulang wajib diisi");
      return;
    }
    if (form.lateToleranceMinutes < 0) {
      toast.error("Toleransi terlambat tidak boleh negatif");
      return;
    }
    if (form.workingDays.length === 0) {
      toast.error("Pilih minimal 1 hari masuk kantor");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/attendance-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Konfigurasi attendance berhasil disimpan");
      if (onSaved) onSaved();
      onClose();
    } catch {
      toast.error("Gagal menyimpan konfigurasi attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfigurasi Kehadiran</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Jam Masuk</Label>
            <Input
              type="time"
              value={form.officeStartTime}
              onChange={(e) => setForm((p) => ({ ...p, officeStartTime: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Jam Pulang</Label>
            <Input
              type="time"
              value={form.officeEndTime}
              onChange={(e) => setForm((p) => ({ ...p, officeEndTime: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Toleransi Terlambat (menit)</Label>
            <Input
              type="number"
              min={0}
              value={form.lateToleranceMinutes}
              onChange={(e) =>
                setForm((p) => ({ ...p, lateToleranceMinutes: Number(e.target.value || 0) }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Hari Masuk Kantor</Label>
                        <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
                  }))
                }
              >
                Senin - Jumat
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    workingDays: DAY_OPTIONS.map((d) => d.value),
                  }))
                }
              >
                Semua Hari
              </Button>
            </div>
            <hr className="my-3"/>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => {
                const active = form.workingDays.includes(day.value);
                return (
                  <Button
                    key={day.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        workingDays: active
                          ? prev.workingDays.filter((d) => d !== day.value)
                          : [...prev.workingDays, day.value],
                      }))
                    }
                  >
                    {day.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={save} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
