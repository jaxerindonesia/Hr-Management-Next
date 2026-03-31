"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X, Save, ShieldCheck, Calendar, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SubmissionType {
  id: string;
  name: string;
}

interface LeaveConfig {
  id: string;
  name: string;
  maxDays: number;
  description?: string | null;
  submissionTypes: SubmissionType[];
}

interface FormState {
  name: string;
  maxDays: string;
  description: string;
  submissionTypeIds: string[];
}

const defaultForm: FormState = {
  name: "",
  maxDays: "",
  description: "",
  submissionTypeIds: [],
};

export default function ModalLeaveConfig({ onClose }: { onClose: () => void }) {
  const [configs, setConfigs] = useState<LeaveConfig[]>([]);
  const [submissionTypes, setSubmissionTypes] = useState<SubmissionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/leave-configs");
      const json = await res.json();
      setConfigs(json.data || []);
    } catch {
      toast.error("Gagal memuat konfigurasi cuti");
    }
  };

  const fetchSubmissionTypes = async () => {
    try {
      const res = await fetch("/api/submission-types");
      const json = await res.json();
      setSubmissionTypes(json.data || []);
    } catch {
      toast.error("Gagal memuat jenis cuti");
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchSubmissionTypes();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (cfg: LeaveConfig) => {
    setEditingId(cfg.id);
    setForm({
      name: cfg.name,
      maxDays: String(cfg.maxDays),
      description: cfg.description || "",
      submissionTypeIds: cfg.submissionTypes.map((t) => t.id),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nama konfigurasi wajib diisi");
    if (!form.maxDays || isNaN(Number(form.maxDays)) || Number(form.maxDays) <= 0)
      return toast.error("Maksimal hari harus angka positif");

    setLoading(true);
    try {
      const url = editingId ? `/api/leave-configs/${editingId}` : "/api/leave-configs";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          maxDays: Number(form.maxDays),
          description: form.description.trim() || null,
          submissionTypeIds: form.submissionTypeIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan");
      }

      toast.success(editingId ? "Konfigurasi berhasil diupdate!" : "Konfigurasi berhasil dibuat!");
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      fetchConfigs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/leave-configs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Konfigurasi berhasil dihapus!");
      setOpenPopoverId(null);
      fetchConfigs();
    } catch {
      toast.error("Gagal menghapus konfigurasi");
    }
  };

  const toggleType = (typeId: string) => {
    setForm((prev) => ({
      ...prev,
      submissionTypeIds: prev.submissionTypeIds.includes(typeId)
        ? prev.submissionTypeIds.filter((id) => id !== typeId)
        : [...prev.submissionTypeIds, typeId],
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            Konfigurasi Batas Cuti
          </DialogTitle>
        </DialogHeader>

        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Atur batas maksimal hari cuti dan pilih jenis pengajuan yang menggunakan batas ini.
            Jenis cuti yang tidak dipilih tidak memiliki batasan hari.
          </span>
        </div>

        {/* Form tambah / edit */}
        {showForm && (
          <div className="border dark:border-gray-700 rounded-xl p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {editingId ? "Edit Konfigurasi" : "Tambah Konfigurasi Baru"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nama Konfigurasi *</Label>
                <Input
                  placeholder="cth: Batas Cuti Hamil"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Maksimal Hari *
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="cth: 12"
                  value={form.maxDays}
                  onChange={(e) => setForm({ ...form, maxDays: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Keterangan (opsional)</Label>
              <Textarea
                placeholder="Keterangan tambahan tentang konfigurasi ini..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Multi-select submission types */}
            <div className="space-y-2">
              <Label>
                Jenis Pengajuan yang Menggunakan Batas Ini
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih satu atau beberapa jenis cuti. Klik untuk memilih/batal pilih.
              </p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                {submissionTypes.length === 0 && (
                  <span className="text-sm text-gray-400">Belum ada jenis pengajuan</span>
                )}
                {submissionTypes.map((type) => {
                  const selected = form.submissionTypeIds.includes(type.id);
                  // Cek apakah type ini sudah dipakai oleh config lain
                  const usedByOther = configs.find(
                    (c) =>
                      c.id !== editingId &&
                      c.submissionTypes.some((t) => t.id === type.id)
                  );
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleType(type.id)}
                      title={usedByOther ? `Sudah digunakan oleh: ${usedByOther.name}` : ""}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : usedByOther
                            ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {type.name}
                      {usedByOther && !selected && (
                        <span className="ml-1 text-[10px] opacity-70">(dipakai)</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {form.submissionTypeIds.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {form.submissionTypeIds.length} jenis cuti dipilih
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultForm); }}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Batal
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={loading}>
                <Save className="w-3.5 h-3.5 mr-1" />
                {loading ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </Button>
            </div>
          </div>
        )}

        {/* Tombol Tambah */}
        {!showForm && (
          <Button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" /> Tambah Konfigurasi Baru
          </Button>
        )}

        {/* Daftar Konfigurasi */}
        <div className="space-y-3 mt-2">
          {configs.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              Belum ada konfigurasi batas cuti
            </div>
          )}
          {configs.map((cfg) => (
            <div
              key={cfg.id}
              className="border dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {cfg.name}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                      <Calendar className="w-3 h-3" />
                      Maks. {cfg.maxDays} hari
                    </span>
                  </div>
                  {cfg.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cfg.description}</p>
                  )}
                  {/* Jenis cuti yang terlibat */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cfg.submissionTypes.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Belum ada jenis yang ditautkan</span>
                    ) : (
                      cfg.submissionTypes.map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                        >
                          {t.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(cfg)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <Popover
                    open={openPopoverId === cfg.id}
                    onOpenChange={(open) => setOpenPopoverId(open ? cfg.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 space-y-3">
                      <p className="text-sm">Yakin hapus konfigurasi <strong>{cfg.name}</strong>?</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOpenPopoverId(null)}>
                          Batal
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(cfg.id)}>
                          Hapus
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
