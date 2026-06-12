import { useEffect, useState } from "react";
import { SubmissionTypeDto } from "@/lib/dto/submission-type";
import { UserDto } from "@/lib/dto/user";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

export default function ModalType({ onClose }: { onClose: () => void }) {
  const [submissionTypes, setSubmissionTypes] = useState<SubmissionTypeDto[]>(
    [],
  );
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [approverUserIds, setApproverUserIds] = useState<string[]>([]);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/submission-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newType.trim(), approverUserIds }),
      });

      if (!res.ok) throw new Error();

      toast.success("Jenis berhasil ditambahkan");
      setNewType("");
      setApproverUserIds([]);
      fetchSubmissionTypes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/submission-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Jenis berhasil dihapus");

      fetchSubmissionTypes();
    } catch {
      toast.error("Gagal menghapus jenis");
    }
  };

  const fetchSubmissionTypes = async () => {
    try {
      const res = await fetch("/api/submission-types");
      if (!res.ok) throw new Error("Gagal mengambil data tipe pengajuan");
      const json = await res.json();
      setSubmissionTypes(json.data || []);
    } catch (err) {
      toast.error("Gagal memuat tipe pengajuan");
    }
  };

  const handleAddApprover = (userId: string) => {
    if (!userId) return;
    setApproverUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const handleRemoveApprover = (userId: string) => {
    setApproverUserIds((prev) => prev.filter((id) => id !== userId));
  };

  useEffect(() => {
    fetchSubmissionTypes();
    fetch("/api/users?limit=9999")
      .then((r) => r.json())
      .then((j) =>
        setUsers(j.data || []),
      )
      .catch(() => setUsers([]));
  }, []);

  const approverUsers = users.filter((u) => {
    const roleName = u.role?.name?.trim().toLowerCase();
    return roleName && roleName !== "karyawan";
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Kelola Jenis Ketidakhadiran
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddType} className="space-y-4">
          <div>
            <div>
              <p className="text-sm">Pemberi Persetujuan (dapat dipilih lebih dari satu)</p>
              <p className="text-xs text-gray-500 mb-2">
                Jika tidak dipilih, sistem otomatis memakai user dengan role Admin/Super Admin.
              </p>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleAddApprover(e.target.value);
                  e.currentTarget.value = "";
                }}
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Pilih user approver...</option>
                {approverUsers
                  .filter((u: any) => !approverUserIds.includes(u.id))
                  .map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>
              <div className="my-2 flex flex-wrap gap-2">
                {approverUserIds.map((id) => {
                  const user = users.find((u: any) => u.id === id);
                  if (!user) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs"
                    >
                      {user.name} ({user.email})
                      <button
                        type="button"
                        onClick={() => handleRemoveApprover(id)}
                        className="hover:text-blue-900"
                        aria-label={`Hapus ${user.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Tambah jenis baru..."
              />
              <Button type="submit" disabled={!newType.trim() || loading}>
                Tambah
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {submissionTypes.map((type) => (
              <div
                key={type.id}
                className="p-3 border rounded-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{type.name}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(type.approverConfigs || []).length > 0 ? (
                    (type.approverConfigs || []).map((cfg) => (
                      <span
                        key={`${type.id}-${cfg.approverUserId}`}
                        className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs"
                      >
                        {cfg.approverUser.name}
                        {cfg.approverUser.email ? ` (${cfg.approverUser.email})` : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Belum ada penyetuju</span>
                  )}
                </div>
              </div>
            ))}

            {submissionTypes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Belum ada jenis
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
