"use client";

import { SubmissionDto } from "@/lib/dto/submission";
import { SubmissionTypeDto } from "@/lib/dto/submission-type";
import {
  Dialog,
  DialogContent,
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

export default function FormData({
  initialData,
  onClose,
  onSuccess,
}: {
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

  const fetchSubmissionTypes = async () => {
    try {
      const res = await fetch("/api/submission-types");
      if (!res.ok) throw new Error("Gagal mengambil data tipe pengajuan");
      const json = await res.json();
      setSubmissionType(json.data || []);
    } catch (err) {
      toast.error("Gagal memuat tipe pengajuan");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      const json = await res.json();
      setEmployees(json.data || []);
    } catch (error) {
      toast.error("Gagal memuat data karyawan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!res.ok) throw new Error("Gagal menyimpan data");
      toast.success(
        `Data cuti berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );

      onSuccess && onSuccess();
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
    if (userData.role && userData.role !== "Super Admin") {
      setFormData((prev) => ({
        ...prev,
        userId: userData.id,
      }));
    }
  }, [userData]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Pengajuan Cuti" : "Tambah Pengajuan Cuti"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="employeeName">Nama Karyawan</Label>
            <Select
              value={
                formData.userId ||
                (userData.role !== "Super Admin" ? userData.id : "")
              }
              onValueChange={(val) => {
                if (userData.role === "Super Admin") {
                  setFormData({
                    ...formData,
                    userId: val,
                  });
                }
              }}
              disabled={userData.role !== "Super Admin"}
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
              value={
                formData.startDate
                  ? new Date(formData.startDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Tanggal Selesai</Label>
            <Input
              type="date"
              value={
                formData.endDate
                  ? new Date(formData.endDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
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
