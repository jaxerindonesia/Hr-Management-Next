"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Penilaian
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="dark:text-gray-100">
                Nama Karyawan
              </TableHead>
              <TableHead className="dark:text-gray-100">Periode</TableHead>
              <TableHead className="dark:text-gray-100">
                Produktivitas
              </TableHead>
              <TableHead className="dark:text-gray-100">Kualitas</TableHead>
              <TableHead className="dark:text-gray-100">Kerjasama</TableHead>
              <TableHead className="dark:text-gray-100">Disiplin</TableHead>
              <TableHead className="dark:text-gray-100">Total Score</TableHead>
              <TableHead className="text-right dark:text-gray-100">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performances.map((perf) => (
              <TableRow
                key={perf.id}
                className="dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <TableCell className="font-medium dark:text-gray-100">
                  {perf.employeeName}
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {perf.period}
                </TableCell>
                <TableCell>
                  <StarRating rating={perf.productivity} />
                </TableCell>
                <TableCell>
                  <StarRating rating={perf.quality} />
                </TableCell>
                <TableCell>
                  <StarRating rating={perf.teamwork} />
                </TableCell>
                <TableCell>
                  <StarRating rating={perf.discipline} />
                </TableCell>
                <TableCell>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {perf.totalScore}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(perf)}
                      className="dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(perf.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
