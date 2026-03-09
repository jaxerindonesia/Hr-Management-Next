import { useEffect, useState } from "react";
import { DepartmentDto } from "@/lib/dto/department";
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

export default function ModalDepartment({ onClose }: { onClose: () => void }) {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newType.trim() }),
      });

      if (!res.ok) throw new Error();

      toast.success("Departemen berhasil ditambahkan");
      setNewType("");
      fetchDepartments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Departemen berhasil dihapus");

      fetchDepartments();
    } catch {
      toast.error("Gagal menghapus departemen");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Gagal mengambil data departemen");
      const json = await res.json();
      setDepartments(json.data || []);
    } catch (err) {
      toast.error("Gagal memuat departemen");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Kelola Departemen
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddType} className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Tambah departemen baru..."
            />
            <Button type="submit" disabled={!newType.trim() || loading}>
              Tambah
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <span>{dept.name}</span>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(dept.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {departments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Belum ada departemen
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
