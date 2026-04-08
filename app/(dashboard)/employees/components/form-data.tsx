"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { UserDto } from "@/lib/dto/user";
import { RoleDto } from "@/lib/dto/role";
import FaceCapture from "./face-capture";

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
import { DepartmentDto } from "@/lib/dto/department";

type TenantDto = {
  id: string;
  companyName: string;
};

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
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [rePassword, setRePassword] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentTenantId, setCurrentTenantId] = useState<string>("");
  const [faceDataUrl, setFaceDataUrl] = useState<string | null>(
    initialData?.avatarUrl || null,
  );
  const [formData, setFormData] = useState<UserDto>(
    initialData || {
      roleId: "",
      departmentId: "",
      department: null,
      nik: "",
      name: "",
      email: "",
      phone: "",
      position: "",
      joinDate: "",
      salary: 0,
      status: "active",
      password: "",
      avatarUrl: "",
      tenantId: "",
    },
  );

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Gagal mengambil data role");
      const json = await res.json();
      setRoles(json.data || []);
    } catch {
      toast.error("Gagal memuat role");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Gagal mengambil data departemen");
      const json = await res.json();
      setDepartments(json.data || []);
    } catch {
      toast.error("Gagal memuat departemen");
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants?page=1&limit=100");
      if (!res.ok) throw new Error("Gagal mengambil data tenant");
      const json = await res.json();
      setTenants(json.data || []);
    } catch {
      toast.error("Gagal memuat tenant");
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
      // Upload face photo if it's a new base64 capture
      let avatarUrl = formData.avatarUrl || "";
      if (faceDataUrl && faceDataUrl.startsWith("data:image")) {
        const uploadRes = await fetch("/api/upload-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: faceDataUrl }),
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          avatarUrl = uploadJson.url;
        } else {
          toast.error("Gagal mengupload foto wajah");
          setLoading(false);
          return;
        }
      }

      const url = formData.id ? `/api/users/${formData.id}` : "/api/users";
      const method = formData.id ? "PUT" : "POST";
      const finalTenantId = isSuperAdmin
        ? formData.tenantId || ""
        : currentTenantId;

      if (!finalTenantId) {
        toast.error("Tenant wajib dipilih");
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatarUrl, tenantId: finalTenantId }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success(
        `Data karyawan berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("hr_user_data");
    if (raw) {
      try {
        const userData = JSON.parse(raw);
        const rawRoleName =
          typeof userData?.role === "string" ? userData.role : userData?.role?.name;
        const normalizedRole = String(rawRoleName || "")
          .toLowerCase()
          .replace(/\s/g, "");
        setIsSuperAdmin(normalizedRole === "superadmin");

        const userTenantId = userData?.tenantId || userData?.tenant_id || "";
        setCurrentTenantId(userTenantId);

        if (!initialData?.id && userTenantId) {
          setFormData((prev) => ({
            ...prev,
            tenantId: userTenantId,
          }));
        }
      } catch {
        setIsSuperAdmin(false);
        setCurrentTenantId("");
      }
    }

    fetchRoles();
    fetchDepartments();
  }, [initialData?.id]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  const visibleRoles = roles.filter((role) => {
    if (isSuperAdmin) return true;
    const normalizedName = String(role.name || "")
      .toLowerCase()
      .replace(/\s/g, "");
    return normalizedName !== "superadmin";
  });

  const selectedTenantId = isSuperAdmin
    ? formData.tenantId || ""
    : currentTenantId || formData.tenantId || "";

  const filteredDepartments = departments.filter((dept) => {
    if (!selectedTenantId) return false;
    return dept.tenantId === selectedTenantId;
  });

  useEffect(() => {
    if (!formData.departmentId) return;

    const isDepartmentStillValid = filteredDepartments.some(
      (dept) => dept.id === formData.departmentId,
    );

    if (!isDepartmentStillValid) {
      setFormData((prev) => ({
        ...prev,
        departmentId: "",
      }));
    }
  }, [filteredDepartments, formData.departmentId]);

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
          <div className={`grid ${isSuperAdmin ? "grid-cols-3" : "grid-cols-2"} gap-4`}>
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
                  {visibleRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id ?? ""}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSuperAdmin && (
              <div className="space-y-1">
                <Label className="block text-sm font-medium dark:text-gray-300">
                  Tenant *
                </Label>
                <Select
                  value={formData.tenantId || ""}
                  onValueChange={(val) =>
                    setFormData({ ...formData, tenantId: val, departmentId: "" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={"Pilih Tenant"} />
                  </SelectTrigger>

                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                Departemen *
              </Label>

              <Select
                value={formData.departmentId || ""}
                onValueChange={(val) =>
                  setFormData({ ...formData, departmentId: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={"Pilih Departemen"} />
                </SelectTrigger>

                <SelectContent>
                  {filteredDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id ?? ""}>
                      {isSuperAdmin
                        ? `${dept.name} - ${dept.tenant?.companyName || "-"}`
                        : dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* NIK & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium dark:text-gray-300">
                NIK
              </Label>
              <Input
                value={formData.nik || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nik: e.target.value })
                }
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
                value={formData.joinDate ? formData.joinDate.split("T")[0] : ""}
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
                Gaji
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

          {/* Foto Wajah */}
          <div className="space-y-1">
            <label className="block text-sm font-medium dark:text-gray-300">
              Foto Wajah (untuk absensi)
            </label>
            <FaceCapture
              value={faceDataUrl}
              onChange={(url) => setFaceDataUrl(url)}
            />
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
