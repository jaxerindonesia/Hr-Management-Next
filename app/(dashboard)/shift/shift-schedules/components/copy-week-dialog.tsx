"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface CopyWeekDialogProps {
  open: boolean;
  loading: boolean;
  branches: BranchDto[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: {
    branchId: string;
    sourceStartDate: string;
    targetStartDate: string;
  }) => void;
}

export default function CopyWeekDialog({
  open,
  loading,
  branches,
  onOpenChange,
  onSubmit,
}: CopyWeekDialogProps) {
  const [branchId, setBranchId] = useState("");
  const [sourceStartDate, setSourceStartDate] = useState("");
  const [targetStartDate, setTargetStartDate] = useState("");

  const shiftBranches = branches.filter(
    (branch) => branch.scheduleType === "SHIFT"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Salin Jadwal Mingguan</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Cabang *</Label>

            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih cabang" />
              </SelectTrigger>

              <SelectContent>
                {shiftBranches.map((branch) => (
                  <SelectItem
                    key={branch.id}
                    value={branch.id ?? ""}
                  >
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Awal Minggu Sumber *</Label>

              <Input
                type="date"
                value={sourceStartDate}
                onChange={(e) => setSourceStartDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Awal Minggu Tujuan *</Label>

              <Input
                type="date"
                value={targetStartDate}
                onChange={(e) => setTargetStartDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Seluruh shift dan libur selama tujuh hari akan disalin. Jadwal
            tujuan yang sudah ada akan diperbarui.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>

          <Button
            disabled={loading}
            onClick={() =>
              onSubmit({
                branchId,
                sourceStartDate,
                targetStartDate,
              })
            }
          >
            {loading ? "Menyalin..." : "Salin Jadwal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}