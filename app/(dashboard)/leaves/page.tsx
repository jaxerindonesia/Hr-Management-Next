"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Edit,
  ChevronLeft,
  ChevronRight,
  Settings,
  Filter,
  X,
} from "lucide-react";
import { useAbsenceTypes } from "@/lib/absence-context";

interface Leave {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

const initialLeaves: Leave[] = [
  {
    id: "1",
    employeeName: "Budi Santoso",
    type: "Cuti",
    startDate: "2024-02-01",
    endDate: "2024-02-03",
    reason: "Liburan keluarga",
    status: "pending",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    type: "Sakit",
    startDate: "2024-01-28",
    endDate: "2024-01-29",
    reason: "Demam",
    status: "approved",
  },
  {
    id: "4",
    employeeName: "Rina Kartika",
    type: "Cuti Hamil",
    startDate: "2024-03-01",
    endDate: "2024-05-31",
    reason: "Melahirkan",
    status: "pending",
  },
];

function LeavesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const actionParam = searchParams.get("action");
  const { absenceTypes, addAbsenceType, removeAbsenceType } = useAbsenceTypes();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  
  const itemsPerPage = 5;

  // Auto open modal if action=new
  useEffect(() => {
    if (actionParam === "new") {
      setShowModal(true);
    }
  }, [actionParam, router]);

  const [formData, setFormData] = useState({
    employeeName: "",
    type: "Cuti",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Load data dari localStorage saat pertama kali
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("hr_user_data");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRole(user.role);
          setUserName(user.name);
          if (user.role !== "Super Admin") {
             setFormData(prev => ({ ...prev, employeeName: user.name }));
          }
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }

      const savedLeaves = localStorage.getItem("hr_leaves");
      if (savedLeaves) {
        setLeaves(JSON.parse(savedLeaves));
      } else {
        // Jika belum ada data, pakai data initial
        setLeaves(initialLeaves);
        localStorage.setItem("hr_leaves", JSON.stringify(initialLeaves));
      }
    }
  }, []);

  // Simpan ke localStorage setiap kali data berubah
  useEffect(() => {
    if (typeof window !== "undefined" && leaves.length > 0) {
      localStorage.setItem("hr_leaves", JSON.stringify(leaves));
    }
  }, [leaves]);

  const handleOpenModal = (leaveToEdit?: Leave) => {
    if (leaveToEdit) {
        // Edit mode would go here if implemented properly, currently the edit button just opens empty modal or with predefined values
        // But the original code just calls handleOpenModal() without args for edit button too? 
        // Wait, line 540 calls handleOpenModal() without args.
        // Let's stick to original behavior but pre-fill name if user.
    }
    
    setFormData({
      employeeName: userRole === "Super Admin" ? "" : (userName || ""),
      type: typeParam || "Cuti",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      employeeName: userRole === "Super Admin" ? "" : (userName || ""),
      type: "Cuti",
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.employeeName || !formData.startDate || !formData.endDate) {
        alert("❌ Mohon isi semua field yang wajib");
        setLoading(false);
        return;
      }

      const newLeave: Leave = {
        id: Date.now().toString(),
        employeeName: formData.employeeName,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: "pending",
      };

      setLeaves([...leaves, newLeave]);
      alert("✅ Pengajuan cuti berhasil disimpan!");
      handleCloseModal();
      router.replace(`/leaves?type=${encodeURIComponent(formData.type)}`);
    } catch (error) {
      console.error("Error saving leave:", error);
      alert("❌ Gagal menyimpan pengajuan cuti");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: string) => {
    const updatedLeaves = leaves.map((leave) =>
      leave.id === id ? { ...leave, status: "approved" as const } : leave,
    );
    setLeaves(updatedLeaves);
    alert("✅ Cuti berhasil disetujui!");
  };

  const handleReject = (id: string) => {
    const updatedLeaves = leaves.map((leave) =>
      leave.id === id ? { ...leave, status: "rejected" as const } : leave,
    );
    setLeaves(updatedLeaves);
    alert("✅ Cuti berhasil ditolak!");
  };

  const handleDelete = (id: string) => {
    if (!confirm("⚠️ Yakin ingin menghapus pengajuan cuti ini?")) return;
    const updatedLeaves = leaves.filter((leave) => leave.id !== id);
    setLeaves(updatedLeaves);
    alert("✅ Pengajuan cuti berhasil dihapus!");
  };

  const clearAllFilters = () => {
    setFilterName("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchTerm("");
  };

  // Count active filters
  const activeFilterCount = [
    filterName !== "",
    filterType !== "all",
    filterStatus !== "all",
    filterStartDate !== "",
    filterEndDate !== "",
  ].filter(Boolean).length;

  // Apply all filters
  const filtered = leaves.filter((emp) => {
    const matchesSearch =
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.startDate.includes(searchTerm);
    
    const matchesName = emp.employeeName.toLowerCase().includes(filterName.toLowerCase());
    const matchesType = filterType === "all" || emp.type === filterType;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    
    let matchesStartDate = true;
    if (filterStartDate) {
      matchesStartDate = emp.startDate >= filterStartDate;
    }
    
    let matchesEndDate = true;
    if (filterEndDate) {
      matchesEndDate = emp.endDate <= filterEndDate;
    }

    const matchesTypeParam = typeParam
      ? emp.type.toLowerCase().includes(typeParam.toLowerCase())
      : true;

    const matchesUser = userRole === "Super Admin" || emp.employeeName === userName;

    return matchesSearch && matchesName && matchesType && matchesStatus && 
           matchesStartDate && matchesEndDate && matchesTypeParam && matchesUser;
  });

  // Get unique types for filter
  const uniqueTypes = Array.from(
    new Set(leaves.map((leave) => leave.type))
  ).sort();

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterName, filterType, filterStatus, filterStartDate, filterEndDate]);
  
  // Reset page when type filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [typeParam]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        {/* Header dengan Kelola Jenis di kiri dan Filter di kanan */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Kelola Jenis Button - Di kiri */}
          <button
            onClick={() => setShowTypeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" /> Kelola Jenis
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Filter Button - Di kanan */}
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
                Filter Data Cuti/Izin
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

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Jenis Cuti
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Jenis</option>
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                {filterType !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Jenis: {filterType}
                    <button
                      onClick={() => setFilterType("all")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Status: {filterStatus === "pending" ? "Menunggu" : filterStatus === "approved" ? "Disetujui" : "Ditolak"}
                    <button
                      onClick={() => setFilterStatus("all")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterStartDate && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Dari: {filterStartDate}
                    <button
                      onClick={() => setFilterStartDate("")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterEndDate && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Sampai: {filterEndDate}
                    <button
                      onClick={() => setFilterEndDate("")}
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
                  Nama Karyawan
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Jenis
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Tanggal Mulai
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Tanggal Selesai
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Alasan
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
              {paginatedLeaves.length > 0 ? (
                paginatedLeaves.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3 font-medium dark:text-white">
                      {emp.employeeName}
                    </td>
                    <td className="p-3 dark:text-gray-300">{emp.type}</td>
                    <td className="p-3 dark:text-gray-300">{emp.startDate}</td>
                    <td className="p-3 dark:text-gray-300">{emp.endDate}</td>
                    <td className="p-3 dark:text-gray-300">
                      {emp.reason || "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : emp.status === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {emp.status === "approved"
                          ? "DISETUJUI"
                          : emp.status === "rejected"
                            ? "DITOLAK"
                            : "MENUNGGU"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {emp.status === "pending" && userRole === "Super Admin" && (
                          <>
                            <button
                              onClick={() => handleApprove(emp.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                              title="Setujui"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(emp.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Tolak"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenModal()}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(userRole === "Super Admin" || emp.status === "pending") && (
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                    Tidak ada data cuti/izin yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t dark:border-gray-700 gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> dari{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{leaves.length}</span> data
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ajukan Cuti/Izin
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Karyawan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeName: e.target.value })
                    }
                    placeholder="Masukkan nama karyawan"
                    disabled={userRole !== "Super Admin"}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole !== "Super Admin" ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-600" : ""}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jenis Cuti <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {absenceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alasan
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Masukkan alasan cuti"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Menyimpan..." : "Ajukan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Type Management Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Kelola Jenis Ketidakhadiran
              </h3>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Tambah jenis baru..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (newType.trim()) {
                      addAbsenceType(newType.trim());
                      setNewType("");
                    }
                  }}
                  disabled={!newType.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {absenceTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-gray-100">
                      {type}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus jenis "${type}"?`)) {
                          removeAbsenceType(type);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeavesPage() {
  return (
    <React.Suspense
      fallback={<div className="p-4 text-center">Loading...</div>}
    >
      <LeavesContent />
    </React.Suspense>
  );
}