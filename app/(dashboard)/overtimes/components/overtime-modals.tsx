"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OvertimeConfigDto, OvertimeDto } from "@/lib/dto/overtime";
import { formatCurrency } from "@/lib/helper/format-currency";

type UserItem = { id: string; name: string; email: string };

type OvertimeModalsProps = {
  configOpen: boolean;
  requestOpen: boolean;
  editOpen: boolean;
  approveOpen: boolean;
  rejectOpen: boolean;
  requestLoading: boolean;
  requestDate: string;
  requestStartTime: string;
  requestEndTime: string;
  requestDescription: string;
  description: string;
  approvePayMethod: "PER_HOUR" | "PER_DAY";
  rejectReason: string;
  selectedRejectId: string | null;
  approverUserIds: string[];
  users: UserItem[];
  config: OvertimeConfigDto;
  editingItem: OvertimeDto | null;
  approvingItem: OvertimeDto | null;
  onCloseConfig: () => void;
  onCloseRequest: () => void;
  onCloseEdit: () => void;
  onCloseApprove: () => void;
  onCloseReject: () => void;
  onSaveConfig: () => void;
  onSubmitRequest: () => void;
  onSaveEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAddApprover: (userId: string) => void;
  onRemoveApprover: (userId: string) => void;
  onRequestDateChange: (value: string) => void;
  onRequestStartTimeChange: (value: string) => void;
  onRequestEndTimeChange: (value: string) => void;
  onRequestDescriptionChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onApprovePayMethodChange: (value: "PER_HOUR" | "PER_DAY") => void;
  onRejectReasonChange: (value: string) => void;
  onHourlyRateChange: (value: number) => void;
  onDailyRateChange: (value: number) => void;
  formatNumberInput: (value: number | string | null | undefined) => string;
};

export function OvertimeModals(props: OvertimeModalsProps) {
  const {
    configOpen,
    requestOpen,
    editOpen,
    approveOpen,
    rejectOpen,
    requestLoading,
    requestDate,
    requestStartTime,
    requestEndTime,
    requestDescription,
    description,
    approvePayMethod,
    rejectReason,
    approverUserIds,
    users,
    config,
    onCloseConfig,
    onCloseRequest,
    onCloseEdit,
    onCloseApprove,
    onCloseReject,
    onSaveConfig,
    onSubmitRequest,
    onSaveEdit,
    onApprove,
    onReject,
    onAddApprover,
    onRemoveApprover,
    onRequestDateChange,
    onRequestStartTimeChange,
    onRequestEndTimeChange,
    onRequestDescriptionChange,
    onDescriptionChange,
    onApprovePayMethodChange,
    onRejectReasonChange,
    onHourlyRateChange,
    onDailyRateChange,
    formatNumberInput,
  } = props;

  return (
    <>
      <Dialog open={configOpen} onOpenChange={(open) => !open && onCloseConfig()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Konfigurasi Tarif Lembur</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-2 md:grid-cols-1 md:items-start">
            <div className="grid gap-2">
              <Label>Pemberi Persetujuan</Label>
              <p className="text-xs text-muted-foreground">Pilih satu atau beberapa approver. Semua approver harus menyetujui agar lembur menjadi disetujui.</p>
              <select defaultValue="" onChange={(e) => { onAddApprover(e.target.value); e.currentTarget.value = ""; }} className="w-full rounded-md border bg-background px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                <option value="">Pilih approver...</option>
                {users.filter((user) => !approverUserIds.includes(user.id)).map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {approverUserIds.map((id) => {
                  const user = users.find((item) => item.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {user?.name || "Approver"}{user?.email ? ` (${user.email})` : ""}
                      <button type="button" onClick={() => onRemoveApprover(id)} className="hover:text-blue-900 dark:hover:text-blue-100" aria-label={`Hapus ${user?.name || "Approver"}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <div className="grid gap-2">
              <Label>Tarif / Jam</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(config.hourlyRate)}
                onChange={(e) => onHourlyRateChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tarif / Hari</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(config.dailyRate)}
                onChange={(e) => onDailyRateChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
              />
              <p className="text-xs text-muted-foreground">Approval terakhir akan memilih metode Per Jam atau Per Hari memakai tarif ini.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={onSaveConfig}>Simpan Konfigurasi</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={requestOpen} onOpenChange={(open) => !open && onCloseRequest()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Ajukan Lembur</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tanggal Lembur</Label>
              <Input type="date" value={requestDate} onChange={(e) => onRequestDateChange(e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input type="time" value={requestStartTime} onChange={(e) => onRequestStartTimeChange(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input type="time" value={requestEndTime} onChange={(e) => onRequestEndTimeChange(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Keterangan</Label>
              <Textarea value={requestDescription} onChange={(e) => onRequestDescriptionChange(e.target.value)} placeholder="Tuliskan alasan lembur" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onCloseRequest}>Batal</Button>
            <Button onClick={onSubmitRequest} disabled={requestLoading || !requestDate || !requestStartTime || !requestEndTime}>Ajukan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !open && onCloseEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Keterangan Overtime</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Keterangan</Label>
              <Textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Tuliskan alasan lembur" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onCloseEdit}><X className="mr-2 h-4 w-4" /> Batal</Button>
            <Button onClick={onSaveEdit}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={(open) => !open && onCloseApprove()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Pilih Metode Lembur</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Metode</Label>
              <Select value={approvePayMethod} onValueChange={(value) => onApprovePayMethodChange(value as "PER_HOUR" | "PER_DAY")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_HOUR">Per Jam</SelectItem>
                  <SelectItem value="PER_DAY">Per Hari</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {approvePayMethod === "PER_HOUR" ? `Tarif / Jam: ${formatCurrency(config.hourlyRate || 0)}` : `Tarif / Hari: ${formatCurrency(config.dailyRate || 0)}`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onCloseApprove}>Batal</Button>
            <Button onClick={onApprove}>Approve</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={(open) => !open && onCloseReject()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Alasan Penolakan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea value={rejectReason} onChange={(e) => onRejectReasonChange(e.target.value)} placeholder="Tulis alasan penolakan..." rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCloseReject}>Batal</Button>
              <Button variant="destructive" onClick={onReject}>Tolak Pengajuan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
