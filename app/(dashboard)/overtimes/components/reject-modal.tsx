"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DialogRejectProps {
  isOpen: boolean;
  rejectReason: string;
  onClose: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onRejectReasonChange: (value: string) => void;
}

export default function RejectModal({
  isOpen,
  rejectReason,
  onClose,
  onConfirm,
  onOpenChange,
  onRejectReasonChange,
}: DialogRejectProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alasan Penolakan</DialogTitle>
          <DialogDescription>
            Tulis alasan penolakan sebelum pengajuan ditolak.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={rejectReason}
            onChange={(event) => onRejectReasonChange(event.target.value)}
            placeholder="Tulis alasan penolakan..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Tolak Pengajuan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
