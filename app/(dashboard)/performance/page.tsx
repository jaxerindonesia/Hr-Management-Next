"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Performance {
  id: string;
  employeeName: string;
  period: string;
  productivity: number;
  quality: number;
  teamwork: number;
  discipline: number;
  totalScore: number;
  notes: string;
}

const initialEmployeesData = [
  {
    id: "1",
    name: "Budi Santoso",
    position: "Manager",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    position: "Staff",
  },
];

const initialPerformances: Performance[] = [
  {
    id: "1",
    employeeName: "Budi Santoso",
    period: "Q1 2024",
    productivity: 5,
    quality: 5,
    teamwork: 4,
    discipline: 5,
    totalScore: 4.75,
    notes: "Excellent performance",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    period: "Q1 2024",
    productivity: 4,
    quality: 5,
    teamwork: 5,
    discipline: 5,
    totalScore: 4.75,
    notes: "Great team player",
  },
];

export default function PerformancePage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPerformance, setEditingPerformance] =
    useState<Performance | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredPerformances = performances.filter(
    (perf) =>
      perf.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perf.period.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredPerformances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPerformances = filteredPerformances.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const [formData, setFormData] = useState({
    employeeName: "",
    period: "",
    productivity: 3,
    quality: 3,
    teamwork: 3,
    discipline: 3,
    notes: "",
  });

  // Load data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load employees
      const savedEmployees = localStorage.getItem("hr_employees");
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      } else {
        setEmployees(initialEmployeesData);
        // Optionally save to localStorage if we want to persist these defaults
        // localStorage.setItem("hr_employees", JSON.stringify(initialEmployeesData)); 
        // Better not to overwrite if it's meant to be managed by EmployeesPage, 
        // but for this page to work we need data.
      }

      // Load performances
      const savedPerformances = localStorage.getItem("hr_performances");
      if (savedPerformances) {
        setPerformances(JSON.parse(savedPerformances));
      } else {
        setPerformances(initialPerformances);
        localStorage.setItem(
          "hr_performances",
          JSON.stringify(initialPerformances),
        );
      }
    }
  }, []);

  // Save to localStorage whenever performances change
  useEffect(() => {
    if (typeof window !== "undefined" && performances.length > 0) {
      localStorage.setItem("hr_performances", JSON.stringify(performances));
      // Dispatch custom event to notify dashboard
      window.dispatchEvent(new Event("performanceUpdated"));
    }
  }, [performances]);

  const calculateTotalScore = (
    prod: number,
    qual: number,
    team: number,
    disc: number,
  ) => {
    return ((prod + qual + team + disc) / 4).toFixed(2);
  };

  const handleOpenModal = (performance?: Performance) => {
    if (performance) {
      setEditingPerformance(performance);
      setFormData({
        employeeName: performance.employeeName,
        period: performance.period,
        productivity: performance.productivity,
        quality: performance.quality,
        teamwork: performance.teamwork,
        discipline: performance.discipline,
        notes: performance.notes,
      });
    } else {
      setEditingPerformance(null);
      setFormData({
        employeeName: "",
        period: "",
        productivity: 3,
        quality: 3,
        teamwork: 3,
        discipline: 3,
        notes: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerformance(null);
    setFormData({
      employeeName: "",
      period: "",
      productivity: 3,
      quality: 3,
      teamwork: 3,
      discipline: 3,
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeName) {
      alert("Mohon pilih karyawan terlebih dahulu");
      return;
    }

    setLoading(true);

    try {
      const totalScore = parseFloat(
        calculateTotalScore(
          formData.productivity,
          formData.quality,
          formData.teamwork,
          formData.discipline,
        ),
      );

      if (editingPerformance) {
        const updatedPerformances = performances.map((perf) =>
          perf.id === editingPerformance.id
            ? {
                ...perf,
                employeeName: formData.employeeName,
                period: formData.period,
                productivity: formData.productivity,
                quality: formData.quality,
                teamwork: formData.teamwork,
                discipline: formData.discipline,
                totalScore,
                notes: formData.notes,
              }
            : perf,
        );
        setPerformances(updatedPerformances);
        alert("✅ Penilaian berhasil diupdate!");
      } else {
        const newPerformance: Performance = {
          id: Date.now().toString(),
          employeeName: formData.employeeName,
          period: formData.period,
          productivity: formData.productivity,
          quality: formData.quality,
          teamwork: formData.teamwork,
          discipline: formData.discipline,
          totalScore,
          notes: formData.notes,
        };
        setPerformances([...performances, newPerformance]);
        alert("✅ Penilaian berhasil ditambahkan!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving performance:", error);
      alert("❌ Gagal menyimpan penilaian");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("⚠️ Yakin ingin menghapus penilaian ini?")) return;

    try {
      const updatedPerformances = performances.filter((perf) => perf.id !== id);
      setPerformances(updatedPerformances);
      alert("✅ Penilaian berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting performance:", error);
      alert("❌ Gagal menghapus penilaian");
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={
            i < rating
              ? "text-yellow-400 dark:text-yellow-300"
              : "text-gray-300 dark:text-gray-600"
          }
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Penilaian Kinerja
        </h2>
          <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Penilaian
                </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau periode..."
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
                  Produktivitas
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Kualitas
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Kerjasama
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Disiplin
                </th>
                <th className="text-left p-3 font-semibold dark:text-gray-300">
                  Total Score
                </th>
                <th className="text-right p-3 font-semibold dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPerformances.length > 0 ? (
                paginatedPerformances.map((perf) => (
                  <tr
                    key={perf.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3 font-medium dark:text-white">
                      {perf.employeeName}
                    </td>
                    <td className="p-3 dark:text-gray-300">{perf.period}</td>
                    <td className="p-3 dark:text-gray-300">
                      <StarRating rating={perf.productivity} />
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      <StarRating rating={perf.quality} />
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      <StarRating rating={perf.teamwork} />
                    </td>
                    <td className="p-3 dark:text-gray-300">
                      <StarRating rating={perf.discipline} />
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {perf.totalScore}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(perf)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(perf.id)}
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
                    Tidak ada data penilaian yang ditemukan
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
            {Math.min(startIndex + itemsPerPage, filteredPerformances.length)}{" "}
            dari   {filteredPerformances.length} data
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl dark:text-gray-100">
              {editingPerformance
                ? "Edit Penilaian Kinerja"
                : "Tambah Penilaian Kinerja"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="dark:text-gray-300">Nama Karyawan</Label>
              <Select
                value={formData.employeeName}
                onValueChange={(value) =>
                  setFormData({ ...formData, employeeName: value })
                }
                required
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {employees.map((emp) => (
                    <SelectItem
                      key={emp.id}
                      value={emp.name}
                      className="dark:text-gray-100 dark:focus:bg-gray-600"
                    >
                      {emp.name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period" className="dark:text-gray-300">
                Periode
              </Label>
              <Input
                id="period"
                placeholder="e.g. Q1 2024, Januari 2024"
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productivity" className="dark:text-gray-300">
                  Produktivitas (1-5)
                </Label>
                <Select
                  value={formData.productivity.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productivity: parseInt(value) })
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="dark:text-gray-100 dark:focus:bg-gray-600"
                      >
                        {num} {"★".repeat(num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality" className="dark:text-gray-300">
                  Kualitas (1-5)
                </Label>
                <Select
                  value={formData.quality.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quality: parseInt(value) })
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="dark:text-gray-100 dark:focus:bg-gray-600"
                      >
                        {num} {"★".repeat(num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamwork" className="dark:text-gray-300">
                  Kerjasama (1-5)
                </Label>
                <Select
                  value={formData.teamwork.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teamwork: parseInt(value) })
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="dark:text-gray-100 dark:focus:bg-gray-600"
                      >
                        {num} {"★".repeat(num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discipline" className="dark:text-gray-300">
                  Disiplin (1-5)
                </Label>
                <Select
                  value={formData.discipline.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discipline: parseInt(value) })
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="dark:text-gray-100 dark:focus:bg-gray-600"
                      >
                        {num} {"★".repeat(num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="dark:text-gray-300">
                Catatan
              </Label>
              <Input
                id="notes"
                placeholder="Catatan tambahan tentang kinerja"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Score Preview:{" "}
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {calculateTotalScore(
                    formData.productivity,
                    formData.quality,
                    formData.teamwork,
                    formData.discipline,
                  )}
                </span>
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Menyimpan..."
                  : editingPerformance
                    ? "Update"
                    : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
