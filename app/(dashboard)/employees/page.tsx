"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Settings,
} from "lucide-react";
import { UserDto } from "@/lib/dto/user";
import { formatCurrency } from "@/lib/helper/format-currency";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import FormData from "./components/form-data";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/lib/helper/check-role";
import ModalDepartment from "./components/modal-department";
import { DepartmentDto } from "@/lib/dto/department";

export default function EmployeesPage() {
  const { checkRole, checkRoleMulti } = usePermission();
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [formData, setFormData] = useState<UserDto>({
    roleId: "",
    departmentId: "",
    nik: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    joinDate: "",
    salary: 0,
    password: "",
    status: "active",
  });

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleOpenModal = (data?: UserDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
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
      password: "",
      status: "active",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus karyawan");
      toast.success("Karyawan berhasil dihapus!");
      fetchUsers();
    } catch (error) {
      toast.error("Gagal menghapus karyawan");
    }
  };

  const clearAllFilters = () => {
    setFilterDepartment("all");
    setFilterStatus("all");
    setSearchTerm("");
  };

  // Count active filters
  const activeFilterCount = [
    filterDepartment !== "all",
    filterStatus !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(itemsPerPage));
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterDepartment !== "all")
        params.set("departmentId", filterDepartment);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      const json = await res.json();
      setEmployees(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      toast.error("Gagal memuat data karyawan");
    }
  }, [currentPage, searchTerm, filterStatus, filterDepartment]);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterStatus]);

  // Fetch data when page or filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
    fetchDepartments();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            {checkRole("departments", "create") && (
              <button
                onClick={() => setShowDepartmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings className="w-4 h-4" /> Kelola Departemen
              </button>
            )}

            {checkRole("users", "create") && (
              <>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>

                <div className="flex-1"></div>
              </>
            )}

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama, NIK, posisi..."
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

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilterPanel
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Filter Data Karyawan
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Hapus Semua Filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Departemen
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Departemen</option>
                    {departments.map((dept) => (
                      <option key={dept?.id} value={dept?.id!}>
                        {dept?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Pencarian: {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterDepartment !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Departemen:{" "}
                      {departments.find((d) => d.id === filterDepartment)
                        ?.name || filterDepartment}
                      <button
                        onClick={() => setFilterDepartment("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Status:{" "}
                      {filterStatus === "active" ? "Aktif" : "Tidak Aktif"}
                      <button
                        onClick={() => setFilterStatus("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    NIK
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Nama
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Posisi
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Departemen
                  </th>
                  {userData.role === "Super Admin" && (
                    <th className="text-left p-3 font-semibold dark:text-gray-300">
                      Gaji
                    </th>
                  )}
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Status
                  </th>
                  {checkRoleMulti("users", ["update", "delete"]) && (
                    <th className="text-right p-3 font-semibold dark:text-gray-300">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {emp.nik || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.name || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.position || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.department?.name || "-"}
                      </td>
                      {userData.role === "Super Admin" && (
                        <td className="p-3 dark:text-gray-300">
                          {formatCurrency(emp.salary || 0)}
                        </td>
                      )}
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            emp.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {emp.status === "active" ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {checkRole("users", "update") && (
                            <button
                              onClick={() => handleOpenModal(emp)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {checkRole("users", "delete") && (
                            <Popover
                              open={openPopoverId === emp.id}
                              onOpenChange={(isOpen) =>
                                setOpenPopoverId(isOpen ? emp.id! : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus karyawan ini?
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
                                    onClick={() => handleDelete(emp.id!)}
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
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Tidak ada data karyawan yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {employees.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {total}
              </span>{" "}
              karyawan
              {totalPages > 0 && (
                <span>
                  {" "}
                  — Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
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
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <FormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchUsers}
        />
      )}

      {/* Department Management Modal */}
      {showDepartmentModal && (
        <ModalDepartment onClose={() => setShowDepartmentModal(false)} />
      )}
    </>
  );
}
