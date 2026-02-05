"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
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

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [formData, setFormData] = useState<UserDto>({
    roleId: "",
    nik: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    joinDate: "",
    salary: 0,
    password: "",
    status: "active",
  });
  
  // Filter states
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterName, setFilterName] = useState("");
  const [filterNip, setFilterNip] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const itemsPerPage = 5;

  // Get unique departments, positions, and statuses for filter options
  const uniqueDepartments = Array.from(
    new Set(employees.map((emp) => emp.department))
  ).sort();
  
  const uniquePositions = Array.from(
    new Set(employees.map((emp) => emp.position))
  ).sort();

  const handleOpenModal = (data?: UserDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      roleId: "",
      nik: "",
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
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
    setFilterPosition("all");
    setFilterStatus("all");
    setFilterName("");
    setFilterNip("");
    setSearchTerm("");
  };

  // Count active filters
  const activeFilterCount = [
    filterDepartment !== "all",
    filterPosition !== "all",
    filterStatus !== "all",
    filterName !== "",
    filterNip !== "",
  ].filter(Boolean).length;

  // Apply all filters
  const filteredEmployees = employees.filter((emp) => {
    // Search filter
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nik!.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position!.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department!.toLowerCase().includes(searchTerm.toLowerCase());

    // Specific Name filter
    const matchesName = emp.name.toLowerCase().includes(filterName.toLowerCase());

    // Specific NIK filter
    const matchesNip = emp.nik!.toLowerCase().includes(filterNip.toLowerCase());

    // Department filter
    const matchesDepartment =
      filterDepartment === "all" || emp.department === filterDepartment;

    // Position filter
    const matchesPosition =
      filterPosition === "all" || emp.position === filterPosition;

    // Status filter
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;

    return matchesSearch && matchesName && matchesNip && matchesDepartment && matchesPosition && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      const json = await res.json();
      setEmployees(json.data || []);
    } catch (err) {
      toast.error("Gagal memuat data karyawan");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterPosition, filterStatus, filterName, filterNip]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>

            {/* Spacer untuk mendorong tombol Filter ke kanan */}
            <div className="flex-1"></div>
            
            {/* Filter Button - Sekarang di kanan */}
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
                {/* Name Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Nama Karyawan
                  </label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Filter nama..."
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* NIK Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    NIK
                  </label>
                  <input
                    type="text"
                    value={filterNip}
                    onChange={(e) => setFilterNip(e.target.value)}
                    placeholder="Filter NIK..."
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
                    {uniqueDepartments.map((dept) => (
                      <option key={dept} value={dept!}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Posisi
                  </label>
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Posisi</option>
                    {uniquePositions.map((pos) => (
                      <option key={pos} value={pos!}>
                        {pos}
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
                  {filterName && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Nama: {filterName}
                      <button
                        onClick={() => setFilterName("")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterNip && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      NIK: {filterNip}
                      <button
                        onClick={() => setFilterNip("")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterDepartment !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Departemen: {filterDepartment}
                      <button
                        onClick={() => setFilterDepartment("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterPosition !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Posisi: {filterPosition}
                      <button
                        onClick={() => setFilterPosition("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Status: {filterStatus === "active" ? "Aktif" : "Tidak Aktif"}
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
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Gaji
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-right p-3 font-semibold dark:text-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {emp.nik || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">{emp.name || "-"}</td>
                      <td className="p-3 dark:text-gray-300">{emp.position || "-"}</td>
                      <td className="p-3 dark:text-gray-300">
                        {emp.department || "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {formatCurrency(emp.salary || 0)}
                      </td>
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
                          <button
                            onClick={() => handleOpenModal(emp)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Popover
                            open={openPopoverId === emp.id}
                            onOpenChange={(isOpen) =>
                              setOpenPopoverId(isOpen ? emp.id! : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <button
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
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
                                  onClick={() =>setOpenPopoverId(null)}
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
                          {/* <button
                            hidden={emp.id === undefined}
                            onClick={() => handleDelete(emp.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button> */}
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
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{filteredEmployees.length}</span> dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{employees.length}</span> karyawan
            </div>

            {filteredEmployees.length > 0 && (
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Halaman {currentPage} dari {totalPages}
                </p>
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
    </>
  );
}