"use client";

import { useState, useEffect } from "react";
import {
  Edit,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayrollDto } from "@/lib/dto/payroll";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/helper/format-currency";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FormData from "./components/form-data";
import { months } from "@/lib/helper/date";

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<PayrollDto>({
    userId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    totalSalary: 0,
    status: "pending",
  });

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const itemsPerPage = 5;

  const handleOpenModal = (data?: PayrollDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      userId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      totalSalary: 0,
      status: "pending",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/payrolls/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus gaji");
      toast.success("Gaji berhasil dihapus!");
      fetchPayrolls();
    } catch (error) {
      toast.error("Gagal menghapus gaji");
    }
  };

  // Calculate current month totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthPayrolls = payrolls.filter(
    (p) => p.year === currentYear,
  );
  const currentMonthTotal = currentMonthPayrolls.reduce(
    (sum, p) => sum + p.totalSalary,
    0,
  );
  const currentMonthPaid = currentMonthPayrolls
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.totalSalary, 0);
  const currentMonthPending = currentMonthPayrolls
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.totalSalary, 0);

  // Get unique years for filter
  const uniqueYears = Array.from(new Set(payrolls.map(p => p.year))).sort((a, b) => b - a);

  const clearAllFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterStatus("all");
    setSearchTerm("");
  };

  const activeFilterCount = [
    filterMonth !== "all",
    filterYear !== "all",
    filterStatus !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  const filtered = payrolls.filter((pay) => {
    const matchesSearch =
      searchTerm === "" ||
      pay.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.year.toString().includes(searchTerm) ||
      pay.month.toString().includes(searchTerm);

    const matchesMonth =
      filterMonth === "all" || pay.month === Number(filterMonth);

    const matchesYear =
      filterYear === "all" || pay.year === Number(filterYear);

    const matchesStatus =
      filterStatus === "all" || pay.status === filterStatus;

    return matchesSearch && matchesMonth && matchesYear && matchesStatus;
  });
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayrolls = filtered.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const fetchPayrolls = async () => {
    try {
      const res = await fetch("/api/payrolls");
      if (!res.ok) throw new Error("Gagal mengambil data gaji");
      const json = await res.json();
      setPayrolls(json.data || []);
    } catch (err) {
      toast.error("Gagal memuat data gaji");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterYear, filterStatus]);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Paid */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Gaji Dibayar (Paid)
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(currentMonthPaid)}
                </p>
                <p className="text-green-200 text-xs mt-1">
                  {currentMonth} {currentYear}
                </p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-green-400 bg-opacity-30 rounded-full">
                <span className="text-2xl font-bold text-green-100">✓</span>
              </div>
            </div>
          </div>

          {/* Total Pending */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">
                  Gaji Pending
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(currentMonthPending)}
                </p>
                <p className="text-yellow-200 text-xs mt-1">
                  {currentMonth} {currentYear}
                </p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-yellow-400 bg-opacity-30 rounded-full">
                <span className="text-2xl font-bold text-yellow-100">⏱</span>
              </div>
            </div>
          </div>

          {/* Total All */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Total Semua Gaji
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(currentMonthTotal)}
                </p>
                <p className="text-purple-200 text-xs mt-1">
                  {currentMonth} {currentYear}
                </p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-purple-400 bg-opacity-30 rounded-full">
                <span className="text-2xl font-bold text-purple-100">Rp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Proses Gaji
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilterPanel || activeFilterCount > 0
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
                  Filter Data Payroll
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
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Cari
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nama, bulan, atau tahun"
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Bulan
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Bulan</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value.toString()}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Tahun
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Tahun</option>
                    {uniqueYears.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <option value="paid">Dibayar (Paid)</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Cari: {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterMonth !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Bulan: {filterMonth}
                      <button
                        onClick={() => setFilterMonth("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterYear !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Tahun: {filterYear}
                      <button
                        onClick={() => setFilterYear("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Status: {filterStatus === "paid" ? "Dibayar" : "Pending"}
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
                    Nama Karyawan
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Periode
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Gaji Pokok
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Tunjangan
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Potongan
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Total Gaji
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
                {paginatedPayrolls.length > 0 ? (
                  paginatedPayrolls.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {emp.user?.name}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {months.find(v => v.value === emp.month)?.label} {emp.year}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {formatCurrency(emp.basicSalary)}
                      </td>
                      <td className="p-3 text-green-600 dark:text-green-400">
                        + {formatCurrency(emp.allowances)}
                      </td>
                      <td className="p-3 text-red-600 dark:text-red-400">
                        - {formatCurrency(emp.deductions)}
                      </td>
                      <td className="p-3 font-bold dark:text-white">
                        {formatCurrency(emp.totalSalary)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            emp.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {emp.status === "paid" ? "Dibayar" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {/* {emp.status === "pending" && (
                            <button
                              onClick={() => handleMarkAsPaid(emp.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Tandai Sudah Dibayar"
                            >
                              <span className="font-bold text-xs">BAYAR</span>
                            </button>
                          )} */}
                          <button
                            onClick={() => handleOpenModal(emp)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus gaji ini?
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
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Tidak ada data payroll yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {Math.min(startIndex + itemsPerPage, filtered.length)}{" "}
              dari {filtered.length} data
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
          </div>
        </div>
      </div>
      
      {showModal && (
        <FormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchPayrolls}
        />
      )}
    </>
  );
}
