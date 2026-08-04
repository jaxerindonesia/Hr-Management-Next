"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

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
import type {
  EmployeeShiftScheduleDto,
  WorkShiftDto,
} from "@/lib/dto/work-shift";
import type { UserDto } from "@/lib/dto/user";

export type ScheduleFormValue = {
  branchId: string;
  shiftId: string;
  isDayOff: boolean;
  userIds: string[];
  startDate: string;
  endDate: string;
};

interface FormDataProps {
  open: boolean;
  loading: boolean;
  initialData: EmployeeShiftScheduleDto | null;
  branches: BranchDto[];
  shifts: WorkShiftDto[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: ScheduleFormValue) => void;
}

export default function FormData({
  open,
  loading,
  initialData,
  branches,
  shifts,
  onOpenChange,
  onSubmit,
}: FormDataProps) {
  const initialDate = initialData?.workDate
    ? new Date(initialData.workDate).toISOString().slice(0, 10)
    : "";

  const [form, setForm] = useState<ScheduleFormValue>(
    initialData
      ? {
          branchId: initialData.branchId,
          shiftId: initialData.shiftId ?? "",
          isDayOff: initialData.isDayOff,
          userIds: [initialData.userId],
          startDate: initialDate,
          endDate: initialDate,
        }
      : {
          branchId: "",
          shiftId: "",
          isDayOff: false,
          userIds: [],
          startDate: "",
          endDate: "",
        }
  );

  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !form.branchId) return;

    fetch(
      `/api/users?page=1&limit=999999&branchId=${form.branchId}&status=active`
    )
      .then((response) => response.json())
      .then((json) => setEmployees(json.data || []))
      .catch(() => setEmployees([]));
  }, [form.branchId, open]);

  const shiftBranches = useMemo(
    () => branches.filter((branch) => branch.scheduleType === "SHIFT"),
    [branches]
  );

  const availableShifts = useMemo(
    () =>
      shifts.filter(
        (shift) => shift.branchId === form.branchId && shift.isActive
      ),
    [shifts, form.branchId]
  );

  const visibleEmployees = useMemo(() => {
    const keyword = search.toLowerCase();

    return employees.filter((employee) =>
      `${employee.name} ${employee.nik ?? ""} ${employee.position ?? ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [employees, search]);

  const toggleUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Jadwal Shift" : "Atur Jadwal Shift"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <section className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <h3 className="font-semibold sm:col-span-2">Jadwal</h3>

            <div className="grid gap-2">
              <Label>Cabang *</Label>

              <Select
                disabled={Boolean(initialData)}
                value={form.branchId}
                onValueChange={(branchId) =>
                  setForm((prev) => ({
                    ...prev,
                    branchId,
                    shiftId: "",
                    userIds: [],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih cabang shifting" />
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

            <div className="grid gap-2">
              <Label>Jenis Jadwal *</Label>

              <Select
                value={form.isDayOff ? "DAY_OFF" : form.shiftId}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    isDayOff: value === "DAY_OFF",
                    shiftId: value === "DAY_OFF" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih shift atau libur" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DAY_OFF">Libur</SelectItem>

                  {availableShifts.map((shift) => (
                    <SelectItem
                      key={shift.id}
                      value={shift.id ?? ""}
                    >
                      {shift.name} · {shift.startTime}-{shift.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Mulai *</Label>

              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    ...(initialData
                      ? { endDate: e.target.value }
                      : {}),
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Selesai *</Label>

              <Input
                disabled={Boolean(initialData)}
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </section>

          <section className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold">Karyawan</h3>
                <p className="text-sm text-muted-foreground">
                  {form.userIds.length} karyawan dipilih
                </p>
              </div>

              {!initialData && employees.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      userIds:
                        prev.userIds.length === employees.length
                          ? []
                          : employees
                              .map((employee) => employee.id ?? "")
                              .filter(Boolean),
                    }))
                  }
                >
                  {form.userIds.length === employees.length
                    ? "Batalkan Semua"
                    : "Pilih Semua"}
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Cari nama, NIK, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {visibleEmployees.map((employee) => {
                const selected = form.userIds.includes(employee.id ?? "");

                return (
                  <Button
                    key={employee.id}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    disabled={Boolean(initialData)}
                    className="h-auto justify-start p-3 text-left"
                    onClick={() =>
                      employee.id && toggleUser(employee.id)
                    }
                  >
                    <span>
                      <span className="block font-medium">
                        {employee.name}
                      </span>

                      <span
                        className={`block text-xs ${
                          selected
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {employee.nik || employee.position || "-"}
                      </span>
                    </span>
                  </Button>
                );
              })}

              {form.branchId && visibleEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Tidak ada karyawan ditemukan.
                </p>
              )}
            </div>
          </section>
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
            onClick={() => onSubmit(form)}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}