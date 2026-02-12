import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { PerformanceDto } from "@/lib/dto/performance";
import { toast } from "sonner";
import { UserDto } from "@/lib/dto/user";

export default function FormData({
    initialData,
    onClose,
    onSuccess,
}: {
    initialData?: any;
    onClose: () => void;
    onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [formData, setFormData] = useState<PerformanceDto>(
    initialData || {
      userId: "",
      period: "",
      productivity: 0,
      quality: 0,
      teamwork: 0,
      discipline: 0,
      notes: "",
      totalScore: 0,
      evaluatedBy: "",
    },
  );

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
         if (!res.ok) throw new Error("Gagal mengambil data karyawan");
         const json = await res.json();
         setEmployees(json.data || []);
     } catch (error) {
         toast.error("Gagal memuat data karyawan");
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.userId) {
      toast.error("User ID wajib diisi");
      setLoading(false);
      return;
    }

    // add data evaluator from local storage
    formData.evaluatedBy = JSON.parse(localStorage.getItem("hr_user_data") || "null").name;

    try {
      const url = formData.id ? `/api/performances/${formData.id}` : "/api/performances";

      const method = formData.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success(
        `Data penilaian berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
      );
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      toast.error((error as Error).message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);
  
  return (
    <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formData.id
                ? "Edit Penilaian Kinerja"
                : "Tambah Penilaian Kinerja"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Nama Karyawan</Label>
                <Select
                  value={formData.userId || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, userId: value })
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={"Pilih Karyawan"} />
                  </SelectTrigger>

                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem
                        key={emp.id}
                        value={emp.id || ""}
                        className="dark:text-gray-100 dark:focus:bg-gray-600"
                      >
                        {emp.name} {emp.position ? `- ${emp.position}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
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

              <div className="grid gap-2">
                <Label htmlFor="notes" className="dark:text-gray-300">
                  Catatan
                </Label>
                <Input
                  id="notes"
                  placeholder="Catatan tambahan tentang kinerja"
                  value={formData.notes ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
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
            </div> */}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
  
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : formData.id ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  );
}