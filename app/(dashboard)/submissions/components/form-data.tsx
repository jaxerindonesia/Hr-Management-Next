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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserDto } from "@/lib/dto/user";
import { Label } from "@/components/ui/label";
import { parseApiError } from "@/lib/helper/response-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.proofUrl ?? null,
  );
  const [isProofRemoved, setIsProofRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<SubmissionDto>(
    initialData || {
      userId: "",
      submissionTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      proofUrl: null,
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
      if (!res.ok) {
        throw new Error(
          await parseApiError(res, "Gagal mengambil data tipe pengajuan"),
        );
      }
      const json = await res.json();
      setSubmissionType(json.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat tipe pengajuan",
      );
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error(
          await parseApiError(res, "Gagal mengambil data karyawan"),
        );
      }
      const json = await res.json();
      setEmployees(json.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data karyawan",
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung");
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setIsProofRemoved(false);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }

    setPreviewUrl("pdf");
  };

  const removeProof = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setIsProofRemoved(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      const fd = new globalThis.FormData();

      fd.append("userId", formData.userId || "");
      fd.append("submissionTypeId", formData.submissionTypeId);
      fd.append("startDate", startDateValue);
      fd.append("endDate", endDateValue);
      fd.append("reason", formData.reason);
      fd.append("status", formData.status || "PENDING");

      if (formData.id) {
        fd.append("id", formData.id);
      }

      if (selectedFile) {
        fd.append("file", selectedFile);
      }

      if (isProofRemoved && !selectedFile) {
        fd.append("removeProof", "true");
      }

      const res = await fetch(url, {
        method,
        body: fd,
      });

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Gagal menyimpan data"));
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
      setSelectedFile(null);
      setPreviewUrl(initialData.proofUrl ?? null);
      setIsProofRemoved(false);
      return;
    }

    setFormData({
      userId: "",
      submissionTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      proofUrl: null,
      status: "PENDING",
      approvedBy: null,
      approvedAt: null,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsProofRemoved(false);
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isPdf =
    previewUrl === "pdf" ||
    (!selectedFile && formData.proofUrl?.toLowerCase().endsWith(".pdf"));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Pengajuan Ketidakhadiran" : "Tambah Pengajuan Ketidakhadiran"}
          </DialogTitle>
          <DialogDescription>
            {formData.id
              ? "Perbarui detail pengajuan ketidakhadiran yang sudah dibuat."
              : "Lengkapi form untuk membuat pengajuan ketidakhadiran baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          {userData.role !== "Karyawan" && (
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="employeeName">Nama Karyawan</Label>
              <Select
                value={formData.userId}
                onValueChange={(val) => {
                  setFormData({
                    ...formData,
                    userId: val,
                  });
                }}
              >
                <SelectTrigger className="min-w-0 w-full">
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
          )}

          <div className="grid min-w-0 gap-2">
            <Label>Jenis Cuti</Label>
            <Select
              value={formData.submissionTypeId}
              onValueChange={(val) =>
                setFormData({ ...formData, submissionTypeId: val })
              }
            >
              <SelectTrigger className="min-w-0 w-full">
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

          <div className="grid min-w-0 gap-2">
            <Label>Tanggal Mulai</Label>
            <Input
              className="min-w-0 w-full"
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

          <div className="grid min-w-0 gap-2">
            <Label>Tanggal Selesai</Label>
            <Input
              className="min-w-0 w-full"
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

          <div className="grid min-w-0 gap-2">
            <Label>Alasan</Label>
            <Textarea
              className="min-w-0 w-full"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Masukkan alasan cuti"
            />
          </div>

          <div className="grid min-w-0 gap-3">
            <Label htmlFor="submission-proof">Bukti Pengajuan</Label>

            {!previewUrl ? (
              <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 text-center">
                <Upload className="h-6 w-6 text-gray-500" />
                <p className="text-sm text-gray-500">
                  JPG, PNG, PDF (Maks. 5MB)
                </p>
                <input
                  ref={fileInputRef}
                  id="submission-proof"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border">
                {!isPdf ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 w-full object-contain p-4"
                  />
                ) : (
                  <div className="flex items-center gap-4 p-6">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {selectedFile?.name || "Dokumen PDF siap dikirim"}
                      </p>
                      {formData.proofUrl && !selectedFile ? (
                        <a
                          href={formData.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Lihat file saat ini
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 bg-gray-50 p-4 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                  <label className="cursor-pointer text-xs">
                    Ganti File
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={removeProof}
                    className="text-xs text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Batal
            </Button>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Menyimpan..." : formData.id ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
