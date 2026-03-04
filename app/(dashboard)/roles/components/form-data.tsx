import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type MasterPermission = {
  model: string;
  actions: string[];
};

type PermissionState = Record<string, Set<string>>;

export default function FormData({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState(initialData?.name || "");
  const [masterPermissions, setMasterPermissions] = useState<
    MasterPermission[]
  >([]);
  const [permissions, setPermissions] = useState<PermissionState>({});

  const handleCheckboxChange = (
    model: string,
    action: string,
    checked: boolean,
  ) => {
    setPermissions((prev) => {
      const current = prev[model] ?? new Set<string>();
      const updated = new Set(current);

      if (checked) updated.add(action);
      else updated.delete(action);

      return { ...prev, [model]: updated };
    });
  };

  const handleSelectAll = (
    model: string,
    actions: string[],
    checked: boolean,
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [model]: checked ? new Set(actions) : new Set(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!roleName.trim()) {
      toast.error("Nama role wajib diisi");
      setLoading(false);
      return;
    }

    const payload = {
      name: roleName,
      permissions: Object.entries(permissions).flatMap(([model, set]) =>
        Array.from(set).map((action) => ({
          model,
          action,
        })),
      ),
    };

    try {
      const url = initialData?.id
        ? `/api/roles/${initialData.id}`
        : "/api/roles";

      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan role");

      toast.success(
        `Role berhasil ${initialData?.id ? "diupdate" : "ditambahkan"}`,
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterPermissions = async () => {
    try {
      const res = await fetch("/api/roles/master-permissions");
      if (!res.ok) throw new Error("Gagal mengambil master permission");

      const json = await res.json();
      const data = json.data || [];

      setMasterPermissions(data);

      const initialPermissionState: any = {};

      const existingPermissions = initialData?.permission || [];

      if (initialData?.id) {
        data.forEach((item: MasterPermission) => {
          const actionsForModel = existingPermissions
            .filter((p: any) => p.model === item.model)
            .map((p: any) => p.action);

          initialPermissionState[item.model] = new Set(actionsForModel);
        });
      }
      setPermissions(initialPermissionState);
    } catch (error) {
      console.log(error);
      toast.error("Gagal memuat daftar permission");
    }
  };

  useEffect(() => {
    fetchMasterPermissions();
  }, []);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Edit Role" : "Tambah Role"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Name */}
          <div className="space-y-2">
            <Label>Nama Role</Label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Mis. Super Admin"
              required
            />
          </div>

          {/* Permission List */}
          <div className="space-y-4">
            {masterPermissions.map((item) => {
              const selectedActions = permissions[item.model] || new Set();
              const selectedCount = selectedActions.size;
              const allSelected =
                selectedCount === item.actions.length &&
                item.actions.length > 0;

              return (
                <div
                  key={item.model}
                  className="border rounded-xl p-4 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">{item.model}</h4>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) =>
                          handleSelectAll(
                            item.model,
                            item.actions,
                            e.target.checked,
                          )
                        }
                      />
                      Select All
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {item.actions.map((action) => (
                      <label
                        key={`${item.model}-${action}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedActions.has(action)}
                          onChange={(e) =>
                            handleCheckboxChange(
                              item.model,
                              action,
                              e.target.checked,
                            )
                          }
                        />
                        {action}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : initialData?.id ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
