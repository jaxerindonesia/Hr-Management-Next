"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { UserDto } from "@/lib/dto/user";
import { RoleDto } from "@/lib/dto/role";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FormData({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData?: UserDto;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rePassword, setRePassword] = useState("");
  const [formData, setFormData] = useState<UserDto>(
    initialData || {
      roleId: "",
      nik: "",
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      joinDate: "",
      salary: 0,
      status: "active",
      password: "",
    },
  );

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Gagal mengambil data role");
      const json = await res.json();
      setRoles(json.data || []);
    } catch (err) {
      toast.error("Gagal memuat role");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if ((!formData.id && !formData.password) || (!formData.id && !rePassword)) {
      toast.error("Password dan konfirmasi password wajib diisi");
      setLoading(false);
      return;
    }

    if (!formData.id && formData.password !== rePassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      setLoading(false);
      return;
    }

    try {
      const url = formData.id ? `/api/users/${formData.id}` : "/api/users";

      const method = formData.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success(
        `Data karyawan berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
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
    fetchRoles();
  }, []);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? "Edit Karyawan" : "Tambah Karyawan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Role *
              </Label>

              <Select
                value={formData.roleId || ""}
                onValueChange={(val) =>
                  setFormData({ ...formData, roleId: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={"Pilih Role"} />
                </SelectTrigger>

                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Departemen *
              </Label>
              <Select
                value={formData.department || ""}
                onValueChange={(val) =>
                  setFormData({ ...formData, department: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* NIK & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                NIK *
              </Label>
              <Input
                value={formData.nik || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nik: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Nama Lengkap *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Email *
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                No. Telepon *
              </Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Position & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Posisi *
              </Label>
              <Input
                value={formData.position || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Tanggal Bergabung *
              </Label>
              <Input
                type="date"
                value={formData.joinDate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    joinDate: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          {/* Salary & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Gaji *
              </Label>
              <Input
                type="text"
                value={
                  formData.salary ? formData.salary.toLocaleString("id-ID") : ""
                }
                onChange={(e) => {
                  // Hapus semua karakter non-digit
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setFormData({
                    ...formData,
                    salary: numericValue ? Number(numericValue) : 0,
                  });
                }}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    status: val as "active" | "inactive",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Password */}
          {!formData.id && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="block text-sm font-medium dark:text-gray-300">
                  Password *
                </Label>
                <Input
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="block text-sm font-medium dark:text-gray-300">
                  Konfirmasi Password *
                </Label>
                <Input
                  type="password"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

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
