"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Trash2, Edit } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payroll
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Proses Gaji
            </Button>
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="dark:text-gray-100">
                Nama Karyawan
              </TableHead>
              <TableHead className="dark:text-gray-100">Periode</TableHead>
              <TableHead className="dark:text-gray-100">Gaji Pokok</TableHead>
              <TableHead className="dark:text-gray-100">Tunjangan</TableHead>
              <TableHead className="dark:text-gray-100">Potongan</TableHead>
              <TableHead className="dark:text-gray-100">Total</TableHead>
              <TableHead className="dark:text-gray-100">Status</TableHead>
              <TableHead className="text-right dark:text-gray-100">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrolls.length > 0 ? (
              payrolls.map((payroll) => (
                <TableRow
                  key={payroll.id}
                  className="dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <TableCell className="font-medium dark:text-gray-100">
                    {payroll.employeeName}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    {payroll.month} {payroll.year}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    {formatCurrency(payroll.basicSalary)}
                  </TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">
                    {formatCurrency(payroll.allowances)}
                  </TableCell>
                  <TableCell className="text-red-600 dark:text-red-400">
                    {formatCurrency(payroll.deductions)}
                  </TableCell>
                  <TableCell className="font-bold dark:text-gray-100">
                    {formatCurrency(payroll.totalSalary)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payroll.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {payroll.status === "paid" ? "Dibayar" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(payroll)}
                        className="dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payroll.id)}
                        className="text-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  Belum ada data payroll. Klik "Proses Gaji" untuk menambahkan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
