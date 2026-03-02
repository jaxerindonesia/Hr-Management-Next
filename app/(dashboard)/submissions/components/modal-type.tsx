import { useEffect, useState } from "react";
import { SubmissionTypeDto } from "@/lib/dto/submission-type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ModalType({ onClose }: { onClose: () => void }) {
  const [submissionTypes, setSubmissionTypes] = useState<SubmissionTypeDto[]>(
    [],
  );
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/submission-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newType.trim() }),
      });

      if (!res.ok) throw new Error();

      toast.success("Jenis berhasil ditambahkan");
      setNewType("");
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

  useEffect(() => {
    fetchSubmissionTypes();
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Kelola Jenis Ketidakhadiran
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddType} className="space-y-4">
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

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {submissionTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <span>{type.name}</span>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(type.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
