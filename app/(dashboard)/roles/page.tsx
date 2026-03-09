"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { RoleDto } from "@/lib/dto/role";
import FormData from "./components/form-data";
import { usePermission } from "@/lib/helper/check-role";

export default function RolesPage() {
  const { checkRole, checkRoleMulti } = usePermission();
  const [roles, setRoles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState({ role: "" });
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<RoleDto>({
    name: "",
    permission: {},
  });

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleOpenModal = (data?: RoleDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: "",
      permission: {},
    });
  };

  const handleDelete = async (id: any) => {
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus role");
      toast.success("Role berhasil dihapus!");
      fetchRoles();
    } catch (error) {
      toast.error("Gagal menghapus role");
    }
  };

  const fetchRoles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(itemsPerPage));
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/roles?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data role");
      const json = await res.json();
      setRoles(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      toast.error("Gagal mengambil data role");
    }
  }, [currentPage, searchTerm]);

  const renderPermissions = (permission: any) => {
    if (Array.isArray(permission)) {
      const grouped: Record<string, string[]> = {};
      for (const item of permission) {
        const model = String(item.model ?? "");
        const action = String(item.action ?? "");
        if (!grouped[model]) grouped[model] = [];
        grouped[model].push(action);
      }
      const entries = Object.entries(grouped);
      return (
        <div className="space-y-2">
          {entries.map(([model, actions]) => (
            <div key={model} className="flex items-center flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200 font-semibold">
                {model}
              </span>
              {actions.map((a) => (
                <span
                  key={`${model}-${a}`}
                  className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {a}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (permission && typeof permission === "object") {
      return (
        <div className="flex flex-wrap gap-2">
          {Object.entries(permission).map(([k, v]: [string, any]) => {
            if (v && typeof v === "object" && "read" in v) {
              return (
                <span
                  key={k}
                  className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                >
                  {k}: {v.read ? "read" : ""}
                  {v.write ? "/write" : ""}
                </span>
              );
            }
            return (
              <span
                key={k}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300"
              >
                {k}
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {JSON.stringify(permission)}
      </span>
    );
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch data when page or search changes
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            {checkRole("roles", "create") && (
              <>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>

                <div className="flex-1" />
              </>
            )}

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 pl-4 pr-10 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Nama Role
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Permissions
                  </th>
                  {checkRoleMulti("roles", ["update", "delete"]) && (
                    <th className="text-right p-3 font-semibold dark:text-gray-300">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={userData.role === "Super Admin" ? 4 : 2}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr
                      key={role.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {role.name}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {renderPermissions(role.permission)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {checkRole("roles", "update") && (
                            <button
                              onClick={() => handleOpenModal(role)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {checkRole("roles", "delete") && (
                            <Popover
                              open={openPopoverId === role.id}
                              onOpenChange={(isOpen) =>
                                setOpenPopoverId(isOpen ? role.id! : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus role ini?
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenPopoverId(null)}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(role.id!)}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {roles.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {total}
              </span>{" "}
              data
              {totalPages > 0 && (
                <span>
                  {" "}
                  — Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <FormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchRoles}
        />
      )}
    </>
  );
}
