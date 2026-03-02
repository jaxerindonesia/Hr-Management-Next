import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { PayrollDto } from "@/lib/dto/payroll";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { months } from "@/lib/helper/date";
import { UserDto } from "@/lib/dto/user";

export default function FormData({
  initialData,
  onClose,
  onSuccess,
} : {
  initialData?: PayrollDto;
  onClose: () => void;
  onSuccess?: () => void;
}) {
 const [loading, setLoading] = useState(false);
 const [employees, setEmployees] = useState<UserDto[]>([]);
 const [formData, setFormData] = useState<PayrollDto>(
   initialData || {
     userId: "",
     month: new Date().getMonth() + 1,
     year: new Date().getFullYear(),
     basicSalary: 0,
     allowances: 0,
     deductions: 0,
     totalSalary: 0,
     status: "pending",
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
   try {
     const url = formData.id ? `/api/payrolls/${formData.id}` : "/api/payrolls"; 
     const method = formData.id ? "PUT" : "POST";    
     const res = await fetch(url, {
       method,
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(formData),
     });

     if (!res.ok) throw new Error("Gagal menyimpan data");   
     toast.success(
       `Data gaji berhasil ${formData.id ? "diupdate" : "disimpan"}!`,
     );

     onSuccess && onSuccess();
     onClose();
   } catch (error) {
     toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
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
            {formData.id ? "Edit Payroll" : "Tambah Payroll Baru"}
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
              <Select
                value={formData.userId || ""}
                onValueChange={(val) => {
                  const selectedEmployee = employees.find((emp) => emp.id === val);
                
                  setFormData({
                    ...formData,
                    userId: val,
                    basicSalary: selectedEmployee?.salary || 0,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={"Pilih Karyawan"} />
                </SelectTrigger>

                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id || ""}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="month">Bulan</Label>
                <Select
                  value={String(formData.month)}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      month: Number(value),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>

                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
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
                type="text"
                value={formData.basicSalary ? formData.basicSalary.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setFormData({
                        ...formData,
                        basicSalary: numericValue ? Number(numericValue) : 0,
                    });
                }}
                placeholder="0"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="allowances">Tunjangan</Label>
              <Input
                id="allowances"
                type="text"
                value={formData.allowances ? formData.allowances.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setFormData({ 
                        ...formData, 
                        allowances: numericValue ? Number(numericValue) : 0 
                    })
                }}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deductions">Potongan</Label>
              <Input
                id="deductions"
                type="text"
                value={formData.deductions ? formData.deductions.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setFormData({ 
                        ...formData, 
                        deductions: numericValue ? Number(numericValue) : 0 
                    })
                }
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
            {/* <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Gaji:</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  (parseFloat(formData.basicSalary) || 0) +
                    (parseFloat(formData.allowances) || 0) -
                    (parseFloat(formData.deductions) || 0),
                )}
              </p>
            </div> */}
          </div>

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