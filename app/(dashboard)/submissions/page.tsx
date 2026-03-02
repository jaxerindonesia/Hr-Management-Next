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
import { toast } from "sonner";
import FormData from "./components/form-data";
import { SubmissionDto } from "@/lib/dto/submission";
import { SubmissionTypeDto } from "@/lib/dto/submission-type";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ModalType from "./components/modal-type";

export default function SubmissionsPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [submissionType, setSubmissionType] = useState<SubmissionTypeDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userData, setUserData] = useState({ id: "", role: "" });

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const itemsPerPage = 5;

  const [formData, setFormData] = useState<SubmissionDto>({
    userId: "",
    submissionTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "PENDING",
    approvedBy: null,
    approvedAt: null,
  });

  const clearAllFilters = () => {
    setFilterName("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchTerm("");
  };

  const activeFilterCount = [
    filterName !== "",
    filterType !== "all",
    filterStatus !== "all",
    filterStartDate !== "",
    filterEndDate !== "",
  ].filter(Boolean).length;

  const filtered = submissions.filter((emp) => {
    // const matchesSearch =
    //   emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   emp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   emp.startDate.includes(searchTerm);

    // const matchesName = emp.employeeName.toLowerCase().includes(filterName.toLowerCase());
    // const matchesType = filterType === "all" || emp.type === filterType;
    // const matchesStatus = filterStatus === "all" || emp.status === filterStatus;

    // let matchesStartDate = true;
    // if (filterStartDate) {
    //   matchesStartDate = emp.startDate >= filterStartDate;
    // }

    // let matchesEndDate = true;
    // if (filterEndDate) {
    //   matchesEndDate = emp.endDate <= filterEndDate;
    // }

    // const matchesTypeParam = typeParam
    //   ? emp.type.toLowerCase().includes(typeParam.toLowerCase())
    //   : true;

    // const matchesUser = userData?.role === "Super Admin" || emp.employeeName === userName;

    // return matchesSearch && matchesName && matchesType && matchesStatus &&
    //        matchesStartDate && matchesEndDate && matchesTypeParam && matchesUser;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = filtered.slice(startIndex, startIndex + itemsPerPage);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error("Gagal mengambil data cuti");
      const json = await res.json();
      setSubmissions(json.data || []);
    } catch (error) {
      toast.error("Gagal memuat data cuti");
    }
  };

  const fetchSubmissionType = async () => {
    try {
      const res = await fetch("/api/submission-types");
      if (!res.ok) throw new Error("Gagal mengambil data cuti");
      const json = await res.json();
      setSubmissionType(json.data || []);
    } catch (error) {
      toast.error("Gagal memuat data cuti");
    }
  };

  const handleOpenModal = (data?: SubmissionDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      userId: "",
      submissionTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      status: "PENDING",
      approvedBy: null,
      approvedAt: null,
    });
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "APPROVED",
          approvedBy: userData?.id,
          approvedAt: new Date(),
        }),
      });
      if (!res.ok) throw new Error("Gagal menyetujui pengajuan cuti");
      toast.success("Pengajuan cuti berhasil disetujui!");
      fetchSubmissions();
    } catch (error) {
      toast.error("Gagal menyetujui pengajuan cuti");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "REJECTED",
          approvedBy: userData?.id,
          approvedAt: new Date(),
        }),
      });
      if (!res.ok) throw new Error("Gagal menolak pengajuan cuti");
      toast.success("Pengajuan cuti berhasil ditolak!");
      fetchSubmissions();
    } catch (error) {
      toast.error("Gagal menolak pengajuan cuti");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus pengajuan cuti");
      toast.success("Pengajuan cuti berhasil dihapus!");
      fetchSubmissions();
    } catch (error) {
      toast.error("Gagal menghapus pengajuan cuti");
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchSubmissionType();

    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    typeParam,
    searchTerm,
    filterName,
    filterType,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => setShowTypeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" /> Kelola Jenis
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>

          <div className="flex-1" />
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
                  {submissionType.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
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
                  <option value="PENDING">Menunggu</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="REJECTED">Ditolak</option>
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
                    Status:{" "}
                    {filterStatus === "PENDING"
                      ? "Menunggu"
                      : filterStatus === "APPROVED"
                        ? "Disetujui"
                        : "Ditolak"}
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
                      {emp.user?.name}
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      {emp.submissionType?.name}
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      {new Date(emp.startDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      {new Date(emp.endDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      {emp.reason || "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.status === "APPROVED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : emp.status === "REJECTED"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {emp.status === "APPROVED"
                          ? "DISETUJUI"
                          : emp.status === "REJECTED"
                            ? "DITOLAK"
                            : "MENUNGGU"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {emp.status === "PENDING" &&
                          userData?.role === "Super Admin" && (
                            <>
                              <button
                                onClick={() => handleApprove(emp.id!)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                title="Setujui"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(emp.id!)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Tolak"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        {emp.status === "PENDING" && (
                          <button
                            onClick={() => handleOpenModal(emp)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {userData?.role === "Super Admin" && (
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
                                Yakin ingin menghapus pengajuan ini?
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
                    Tidak ada data cuti/izin yang ditemukan
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
              {filtered.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {submissions.length}
            </span>{" "}
            data
          </div>

          {filtered.length > 0 && (
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

      {/* Modal Form */}
      {showModal && (
        <FormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchSubmissions}
        />
      )}

      {/* Type Management Modal */}
      {showTypeModal && <ModalType onClose={() => setShowTypeModal(false)} />}
    </div>
  );
}
