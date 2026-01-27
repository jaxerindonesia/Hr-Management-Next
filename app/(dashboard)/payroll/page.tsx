"use client";

import { useState, useEffect } from "react";
import { Edit, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Payroll {
  id: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  totalSalary: number;
  status: "paid" | "pending";
}

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    month: months[new Date().getMonth()],
    year: new Date().getFullYear(),
    basicSalary: "",
    allowances: "",
    deductions: "",
    status: "pending" as "paid" | "pending",
  });

  // Load data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPayrolls = localStorage.getItem("hr_payrolls");
      if (savedPayrolls) {
        setPayrolls(JSON.parse(savedPayrolls));
      }

      const savedEmployees = localStorage.getItem("hr_employees");
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }
    }
  }, []);

  // Save payrolls to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && payrolls.length > 0) {
      localStorage.setItem("hr_payrolls", JSON.stringify(payrolls));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("payrollUpdated"));
    }
  }, [payrolls]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      currencyDisplay: "code",
    })
      .format(amount)
      .replace("IDR", "Rp");
  };

  const handleOpenModal = () => {
    setFormData({
      employeeName: "",
      month: months[new Date().getMonth()],
      year: new Date().getFullYear(),
      basicSalary: "",
      allowances: "",
      deductions: "",
      status: "pending",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const basicSalary = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const totalSalary = basicSalary + allowances - deductions;

    if (editingPayroll) {
      // Update existing payroll
      const updatedPayrolls = payrolls.map((p) =>
        p.id === editingPayroll.id
          ? {
              ...p,
              employeeName: formData.employeeName,
              month: formData.month,
              year: formData.year,
              basicSalary,
              allowances,
              deductions,
              totalSalary,
              status: formData.status,
            }
          : p,
      );
      setPayrolls(updatedPayrolls);
    } else {
      // Add new payroll
      const newPayroll: Payroll = {
        id: Date.now().toString(),
        employeeName: formData.employeeName,
        month: formData.month,
        year: formData.year,
        basicSalary,
        allowances,
        deductions,
        totalSalary,
        status: formData.status,
      };
      setPayrolls([...payrolls, newPayroll]);
    }

    // Reset form and close dialog
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (payroll: Payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employeeName: payroll.employeeName,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary.toString(),
      allowances: payroll.allowances.toString(),
      deductions: payroll.deductions.toString(),
      status: payroll.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data payroll ini?")) {
      const updatedPayrolls = payrolls.filter((p) => p.id !== id);
      setPayrolls(updatedPayrolls);
      localStorage.setItem("hr_payrolls", JSON.stringify(updatedPayrolls));
    }
  };

  const handleMarkAsPaid = (id: string) => {
    const updatedPayrolls = payrolls.map((p) =>
      p.id === id ? { ...p, status: "paid" as const } : p,
    );
    setPayrolls(updatedPayrolls);
  };

  const resetForm = () => {
    setFormData({
      employeeName: "",
      month: months[new Date().getMonth()],
      year: new Date().getFullYear(),
      basicSalary: "",
      allowances: "",
      deductions: "",
      status: "pending",
    });
    setEditingPayroll(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Calculate current month totals
  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const currentMonthPayrolls = payrolls.filter(
    (p) => p.month === currentMonth && p.year === currentYear,
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

  const filtered = payrolls.filter(
    (emp) =>
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.year.toString().includes(searchTerm),
  );

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayrolls = filtered.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payroll
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
              <button
                      onClick={handleOpenModal}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Proses Gaji
                    </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingPayroll ? "Edit Payroll" : "Tambah Payroll Baru"}
              </DialogTitle>
              <DialogDescription>
                Masukkan data gaji karyawan untuk bulan ini
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Employee Name */}
                <div className="grid gap-2">
                  <Label htmlFor="employeeName">Nama Karyawan</Label>
                  {employees.length > 0 ? (
                    <Select
                      value={formData.employeeName}
                      onValueChange={(value) =>
                        setFormData({ ...formData, employeeName: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.name}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="employeeName"
                      value={formData.employeeName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employeeName: e.target.value,
                        })
                      }
                      placeholder="Nama karyawan"
                      required
                    />
                  )}
                </div>

                {/* Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="month">Bulan</Label>
                    <Select
                      value={formData.month}
                      onValueChange={(value) =>
                        setFormData({ ...formData, month: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Salary Details */}
                <div className="grid gap-2">
                  <Label htmlFor="basicSalary">Gaji Pokok</Label>
                  <Input
                    id="basicSalary"
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, basicSalary: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="allowances">Tunjangan</Label>
                  <Input
                    id="allowances"
                    type="number"
                    value={formData.allowances}
                    onChange={(e) =>
                      setFormData({ ...formData, allowances: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deductions">Potongan</Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={formData.deductions}
                    onChange={(e) =>
                      setFormData({ ...formData, deductions: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "paid" | "pending") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Total Preview */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Total Gaji:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      (parseFloat(formData.basicSalary) || 0) +
                        (parseFloat(formData.allowances) || 0) -
                        (parseFloat(formData.deductions) || 0),
                    )}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingPayroll ? "Update" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                      {emp.employeeName}
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      {emp.month} {emp.year}
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
                        {emp.status === "pending" && (
                          <button
                            onClick={() => handleMarkAsPaid(emp.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Tandai Sudah Dibayar"
                          >
                            <span className="font-bold text-xs">BAYAR</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(emp)}
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
            Menampilkan {" "}
            {Math.min(startIndex + itemsPerPage, filtered.length)} dari{" "}
            {filtered.length} data
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
  );
}
