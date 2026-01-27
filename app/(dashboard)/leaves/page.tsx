"use client";

import React, { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle, Trash2, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
];

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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
      type: "Cuti",
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
    (emp) =>
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.startDate.includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Cuti/Izin
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {leaves.length} pengajuan
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajukan Cuti
        </button>
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
              {filtered.length > 0 ? (
                filtered.map((emp) => (
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
                        <button
                          onClick={() => handleOpenModal()}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                    <option value="Cuti">Cuti</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Cuti Hamil">Cuti Hamil</option>
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
    </div>
  );
}
