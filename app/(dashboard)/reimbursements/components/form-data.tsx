"use client";

import { ReimbursementDto } from "@/lib/dto/reimbursement";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserDto } from "@/lib/dto/user";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";

const CATEGORIES = [
    "Transportasi",
    "Akomodasi",
    "Makan & Minum",
    "Kesehatan",
    "Peralatan Kerja",
    "Komunikasi",
    "Lainnya",
];

export default function ReimbursementFormData({
    initialData,
    onClose,
    onSuccess,
}: {
    initialData?: ReimbursementDto;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [employees, setEmployees] = useState<UserDto[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        initialData?.receiptUrl ?? null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ReimbursementDto>(
        initialData || {
            userId: "",
            title: "",
            category: "",
            amount: 0,
            date: "",
            description: "",
            receiptUrl: null,
            status: "pending",
        }
    );

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error();
            const json = await res.json();
            setEmployees(json.data || []);
        } catch {
            toast.error("Gagal memuat data karyawan");
        }
    };

    // Upload file ke server
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side preview
        if (file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl("pdf");
        }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/reimbursements/upload", {
                method: "POST",
                body: fd,
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Upload gagal");

            setFormData((prev) => ({ ...prev, receiptUrl: json.url }));
            toast.success("Berkas berhasil diupload!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Gagal mengupload berkas");
            setPreviewUrl(initialData?.receiptUrl ?? null);
        } finally {
            setUploading(false);
        }
    };

    const removeReceipt = () => {
        setPreviewUrl(null);
        setFormData((prev) => ({ ...prev, receiptUrl: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = formData.id
                ? `/api/reimbursements/${formData.id}`
                : "/api/reimbursements";
            const method = formData.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Gagal menyimpan data");
            toast.success(
                `Reimbursement berhasil ${formData.id ? "diupdate" : "disimpan"}!`
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
        fetchEmployees();
    }, []);

    const isPdf = previewUrl === "pdf" || formData.receiptUrl?.endsWith(".pdf");

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {formData.id ? "Edit Reimbursement" : "Tambah Reimbursement"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Karyawan */}
                    <div className="grid gap-2">
                        <Label>Nama Karyawan</Label>
                        <Select
                            value={formData.userId || ""}
                            onValueChange={(val) => setFormData({ ...formData, userId: val })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Karyawan" />
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

                    {/* Judul */}
                    <div className="grid gap-2">
                        <Label>Judul Klaim</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Contoh: Biaya Makan Dinas Jakarta"
                            required
                        />
                    </div>

                    {/* Kategori */}
                    <div className="grid gap-2">
                        <Label>Kategori</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) => setFormData({ ...formData, category: val })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nominal & Tanggal */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Nominal (Rp)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={formData.amount || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: Number(e.target.value) })
                                }
                                placeholder="500000"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tanggal Pengeluaran</Label>
                            <Input
                                type="date"
                                value={
                                    formData.date
                                        ? new Date(formData.date).toISOString().split("T")[0]
                                        : ""
                                }
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="grid gap-2">
                        <Label>Keterangan (opsional)</Label>
                        <Textarea
                            value={formData.description ?? ""}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Detail tambahan pengeluaran..."
                            rows={3}
                        />
                    </div>

                    {/* Upload Struk / Bukti */}
                    <div className="grid gap-2">
                        <Label>Upload Struk / Bukti Pembayaran</Label>

                        {/* Drop zone */}
                        {!previewUrl ? (
                            <label
                                htmlFor="receipt-upload"
                                className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                            >
                                <Upload className="w-8 h-8 text-gray-400" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {uploading
                                        ? "Mengupload..."
                                        : "Klik atau seret file ke sini"}
                                </p>
                                <p className="text-xs text-gray-400">
                                    JPG, PNG, WebP, atau PDF — maks. 5MB
                                </p>
                                <input
                                    id="receipt-upload"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                        ) : (
                            <div className="relative w-full rounded-xl border dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                                {/* Preview */}
                                {isPdf ? (
                                    <div className="flex items-center gap-3 p-4">
                                        <FileText className="w-10 h-10 text-red-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium dark:text-white">
                                                Dokumen PDF
                                            </p>
                                            {formData.receiptUrl && (
                                                <a
                                                    href={formData.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:underline"
                                                >
                                                    Lihat PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt="Preview struk"
                                        className="w-full max-h-48 object-contain p-2"
                                    />
                                )}

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={removeReceipt}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow"
                                    title="Hapus foto"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>

                                {/* Re-upload */}
                                <label
                                    htmlFor="receipt-upload-replace"
                                    className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow"
                                >
                                    <ImageIcon className="w-3 h-3" /> Ganti
                                    <input
                                        id="receipt-upload-replace"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        )}

                        {uploading && (
                            <p className="text-xs text-blue-500 flex items-center gap-1">
                                <span className="inline-block w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                Mengupload berkas...
                            </p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading || uploading}>
                            {loading ? "Menyimpan..." : formData.id ? "Update" : "Simpan"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
