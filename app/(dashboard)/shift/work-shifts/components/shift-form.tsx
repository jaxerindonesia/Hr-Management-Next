"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BranchDto } from "@/lib/dto/branch";
import type { WorkShiftDto } from "@/lib/dto/work-shift";

export default function ShiftForm({
  open,
  loading,
  form,
  branches,
  onChange,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  form: WorkShiftDto;
  branches: BranchDto[];
  onChange: Dispatch<SetStateAction<WorkShiftDto>>;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Shift" : "Tambah Shift"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Cabang *</Label>
            <Select
              disabled={Boolean(form.id)}
              value={form.branchId}
              onValueChange={(branchId) => onChange({ ...form, branchId })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih cabang shifting" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id || ""}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branches.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Belum ada cabang aktif dengan mode jadwal Shifting. Ubah mode jadwal melalui menu Cabang terlebih
                dahulu.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Nama Shift *</Label>
            <Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label>Kode</Label>
            <Input value={form.code || ""} onChange={(event) => onChange({ ...form, code: event.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label>Jam Masuk *</Label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(event) => onChange({ ...form, startTime: event.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Jam Pulang *</Label>
            <Input
              type="time"
              value={form.endTime}
              onChange={(event) => onChange({ ...form, endTime: event.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Toleransi Terlambat</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ikuti tenant"
              value={form.lateToleranceMinutes ?? ""}
              onChange={(event) =>
                onChange({
                  ...form,
                  lateToleranceMinutes: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.isActive ? "active" : "inactive"}
              onValueChange={(value) => onChange({ ...form, isActive: value === "active" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground sm:col-span-2">
            Shift otomatis dianggap melewati tengah malam jika jam pulang lebih kecil dari jam masuk.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={loading} onClick={onSubmit}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}