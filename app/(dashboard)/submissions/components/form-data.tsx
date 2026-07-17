"use client";

import { SubmissionDto } from "@/lib/dto/submission";
import { SubmissionTypeDto } from "@/lib/dto/submission-type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserDto } from "@/lib/dto/user";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0] ?? "";
}

export default function FormData({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialData?: SubmissionDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [submissionType, setSubmissionType] = useState<SubmissionTypeDto[]>([]);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [formData, setFormData] = useState<SubmissionDto>(
    initialData || {
      userId: "",
      submissionTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      status: "PENDING",
      approvedBy: null,
      approvedAt: null,
    },
  );
  const startDateValue = toInputDate(formData.startDate);
  const endDateValue = toInputDate(formData.endDate);
  const isEndDateBeforeStartDate =
    !!startDateValue && !!endDateValue && endDateValue < startDateValue;

  const fetchSubmissionTypes = async () => {
    try {
      const res = await fetch("/api/submission-types");
      if (!res.ok) throw new Error("Gagal mengambil data tipe pengajuan");
      const json = await res.json();
      setSubmissionType(json.data || []);
    } catch {
      toast.error("Gagal memuat tipe pengajuan");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      const json = await res.json();
      setEmployees(json.data || []);
    } catch {
      toast.error("Gagal memuat data karyawan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEndDateBeforeStartDate) {
      toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai");
      return;
    }

    setLoading(true);

    try {
      const url = formData.id
        ? `/api/submissions/${formData.id}`
        : "/api/submissions";
      const method = formData.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal menyimpan data");
      }

      toast.success(
        `Data cuti berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionTypes();
    fetchEmployees();
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  useEffect(() => {
    if (userData.role && userData.role === "Karyawan") {
      setFormData((prev) => ({
        ...prev,
        userId: userData.id,
      }));
    }
  }, [userData]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      return;
    }

    setFormData({
      userId: "",
      submissionTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      status: "PENDING",
      approvedBy: null,
      approvedAt: null,
    });
  }, [initialData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Pengajuan Cuti" : "Tambah Pengajuan Cuti"}
          </DialogTitle>
          <DialogDescription>
            {formData.id
              ? "Perbarui detail pengajuan cuti yang sudah dibuat."
              : "Lengkapi form untuk membuat pengajuan cuti baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="employeeName">Nama Karyawan</Label>
            <Select
              value={
                formData.userId ||
                (userData.role === "Karyawan" ? userData.id : "")
              }
              onValueChange={(val) => {
                setFormData({
                  ...formData,
                  userId: val,
                });
              }}
              disabled={userData.role === "Karyawan"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={"Pilih Karyawan"} />
              </SelectTrigger>

              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id || ""}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Jenis Cuti</Label>
            <Select
              value={formData.submissionTypeId}
              onValueChange={(val) =>
                setFormData({ ...formData, submissionTypeId: val })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Jenis Cuti" />
              </SelectTrigger>
              <SelectContent>
                {submissionType.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tanggal Mulai</Label>
            <Input
              type="date"
              value={startDateValue}
              onChange={(e) =>
                setFormData((prev) => {
                  const nextStartDate = e.target.value;
                  const nextEndDate =
                    prev.endDate && toInputDate(prev.endDate) < nextStartDate
                      ? nextStartDate
                      : prev.endDate;

                  return {
                    ...prev,
                    startDate: nextStartDate,
                    endDate: nextEndDate,
                  };
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Tanggal Selesai</Label>
            <Input
              type="date"
              value={endDateValue}
              min={startDateValue || undefined}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
            {isEndDateBeforeStartDate ? (
              <p className="text-sm text-red-500">
                Tanggal selesai tidak boleh sebelum tanggal mulai.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Alasan</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Masukkan alasan cuti"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
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
