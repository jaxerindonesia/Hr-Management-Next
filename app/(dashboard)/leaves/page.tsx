"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, CheckCircle, XCircle, Trash2, Search, Edit, ChevronLeft, ChevronRight, Settings } from "lucide-react";
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
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const handleOpenModal = () => {
    setFormData({
      employeeName: "",
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
      employeeName: "",
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

  const filtered = leaves.filter(
    (emp) => {
      const matchesSearch = emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.startDate.includes(searchTerm);
      const matchesType = typeParam ? emp.type.toLowerCase().includes(typeParam.toLowerCase()) : true;
      
      return matchesSearch && matchesType;
    }
  );

  // Reset page when search term changes
  useEffect(() => { 
    setCurrentPage(1);
  }, [searchTerm]);
  // Reset page when type filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [typeParam]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = filtered.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {typeParam ? `Data ${typeParam}` : "Cuti/Izin"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
           
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTypeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" /> Kelola Jenis
          </button> 
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
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
                        {emp.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(emp.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Setujui"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(emp.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Tolak"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenModal()}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
       <div className="flex items-center justify-between mt-4 pt-4 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {" "}
            {Math.min(startIndex + itemsPerPage, filtered.length)} dari{" "}
            {filtered.length} data
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span className="text-gray-900 dark:text-gray-100">{type}</span>
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
    <React.Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <LeavesContent />
    </React.Suspense>
  );
}
