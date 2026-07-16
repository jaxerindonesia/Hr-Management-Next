"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OvertimeConfigDto } from "@/lib/dto/overtime";
import { formatCurrency } from "@/lib/helper/format-currency";

interface LastApproveModalProps {
  isOpen: boolean;
  approvePayMethod: "PER_HOUR" | "PER_DAY";
  config: OvertimeConfigDto;
  onClose: () => void;
  onApprove: () => void;
  onApprovePayMethodChange: (value: "PER_HOUR" | "PER_DAY") => void;
}

export default function LastApproveModal({
  isOpen,
  approvePayMethod,
  config,
  onClose,
  onApprove,
  onApprovePayMethodChange,
}: LastApproveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Metode Lembur</DialogTitle>
          <DialogDescription>
            Approval terakhir perlu memilih metode pembayaran lembur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Metode</Label>
            <Select
              value={approvePayMethod}
              onValueChange={(value) =>
                onApprovePayMethodChange(value as "PER_HOUR" | "PER_DAY")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_HOUR">Per Jam</SelectItem>
                <SelectItem value="PER_DAY">Per Hari</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {approvePayMethod === "PER_HOUR"
                ? `Tarif / Jam: ${formatCurrency(config.hourlyRate || 0)}`
                : `Tarif / Hari: ${formatCurrency(config.dailyRate || 0)}`}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onApprove}>Approve</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
