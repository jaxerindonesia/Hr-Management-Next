"use client";

import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { EMPLOYEE_RECAP_MONTHS } from "@/lib/helper/employee-recap-print";

type BulkRecapPeriodDialogProps = {
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (month: number, year: number) => Promise<void>;
};

export default function BulkRecapPeriodDialog({
  open,
  loading,
  onOpenChange,
  onConfirm,
}: BulkRecapPeriodDialogProps) {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => String(currentYear));
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  const handleConfirm = async () => {
    await onConfirm(Number(month), Number(year));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Pilih Periode Rekap
          </DialogTitle>
          <DialogDescription>
            Pilih bulan dan tahun yang akan digunakan untuk seluruh rekap karyawan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="bulk-recap-month">Bulan</Label>
            <Select value={month} onValueChange={setMonth} disabled={loading}>
              <SelectTrigger id="bulk-recap-month" className="w-full">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_RECAP_MONTHS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bulk-recap-year">Tahun</Label>
            <Select value={year} onValueChange={setYear} disabled={loading}>
              <SelectTrigger id="bulk-recap-year" className="w-full">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((yearOption) => (
                  <SelectItem key={yearOption} value={String(yearOption)}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Menyiapkan..." : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
