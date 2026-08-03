"use client";
import { useEffect, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BranchDto } from "@/lib/dto/branch";

export default function FormData({
  open,
  loading,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  form: BranchDto;
  onOpenChange: (open: boolean) => void;
  onChange: Dispatch<SetStateAction<BranchDto>>;
  onSubmit: () => void;
}) {
  const setForm = onChange;
  const [tenants, setTenants] = useState<Array<{ id: string; companyName: string }>>([]);
  const storedUserData = useSyncExternalStore(
    () => () => { },
    () => localStorage.getItem("hr_user_data"),
    () => null,
  );
  const storedUser = storedUserData ? JSON.parse(storedUserData) : {};
  const isSuperAdmin = String(storedUser.role || storedUser.roleName || "")
    .replace(/\s/g, "")
    .toLowerCase() === "superadmin";

  useEffect(() => {
    if (!open) return;
    if (isSuperAdmin) fetch("/api/tenants?page=1&limit=100").then((response) => response.json()).then((json) => setTenants(json.data || [])).catch(() => setTenants([]));
  }, [isSuperAdmin, open]);

  const useCurrentLocation = () => navigator.geolocation?.getCurrentPosition(({ coords }) => setForm((current) => ({ ...current, latitude: coords.latitude, longitude: coords.longitude })), () => toast.error("Gagal mengambil lokasi"), { enableHighAccuracy: true });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Cabang" : "Tambah Cabang"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <section className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <h3 className="font-semibold sm:col-span-2">Informasi Cabang</h3>
            {isSuperAdmin && <div className="grid gap-2 sm:col-span-2">
              <Label>Tenant *</Label>
              <Select value={form.tenantId} onValueChange={(tenantId) => setForm({ ...form, tenantId })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Tenant" />
                </SelectTrigger>
                <SelectContent>{tenants.map((tenant) => <SelectItem key={tenant.id} value={tenant.id}>{tenant.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>}
            <div className="grid gap-2 sm:col-span-2">
              <Label>Nama Cabang *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Kode Cabang (opsional)<p className="text-xs text-muted-foreground">Isi jika perusahaan memiliki kode sendiri.</p></Label>
              <Input placeholder="Dibuat otomatis jika kosong" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Status Cabang</Label>
              <Select
                value={form.isActive ? "active" : "inactive"}
                onValueChange={(value) => setForm({ ...form, isActive: value === "active" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Alamat</Label>
              <Textarea value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </section>
          <section className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="font-semibold">Lokasi & Radius Absensi</h3>
              <p className="text-sm text-muted-foreground">Tentukan titik kantor dan batas jarak absensi untuk cabang ini.</p>
            </div>
            <Button type="button" variant="outline" className="sm:col-span-2" onClick={useCurrentLocation}>Klik untuk dapatkan lokasi saat ini</Button>
            <div className="grid gap-2">
              <Label>Latitude *</Label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Longitude *</Label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Radius Absensi (meter)</Label>
              <Input type="number" min={1} value={form.attendanceRadiusMeters} onChange={(e) => setForm({ ...form, attendanceRadiusMeters: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Kunci Lokasi</Label>
              <Select
                value={form.locationLockEnabled ? "enabled" : "disabled"}
                onValueChange={(value) => setForm({ ...form, locationLockEnabled: value === "enabled" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Diaktifkan</SelectItem>
                  <SelectItem value="disabled">Dinonaktifkan</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {form.locationLockEnabled
                  ? `Karyawan hanya dapat check-in dan check-out dalam radius ${form.attendanceRadiusMeters || 0} meter dari titik cabang.`
                  : "Karyawan tetap dapat check-in dan check-out dari luar radius cabang. Lokasi tetap dicatat untuk kebutuhan audit."}
              </p>
            </div>
          </section>
          <section className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <h3 className="font-semibold">Jadwal Kerja Cabang</h3>
              <p className="text-sm text-muted-foreground">Cabang menjadi sumber jadwal kerja karyawan.</p>
            </div>
            <div className="grid gap-2">
              <Label>Mode Jadwal</Label>
              <Select value={form.scheduleType} onValueChange={(scheduleType: "REGULAR" | "SHIFT") => setForm({ ...form, scheduleType })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Reguler</SelectItem>
                  <SelectItem value="SHIFT">Shifting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.scheduleType === "REGULAR" ? (
              <div className="grid gap-3">
                {[
                  ["MONDAY", "Senin"], ["TUESDAY", "Selasa"], ["WEDNESDAY", "Rabu"],
                  ["THURSDAY", "Kamis"], ["FRIDAY", "Jumat"], ["SATURDAY", "Sabtu"], ["SUNDAY", "Minggu"],
                ].map(([dayOfWeek, label]) => {
                  const schedule = form.workingSchedules.find((row) => row.dayOfWeek === dayOfWeek) ?? { dayOfWeek, isWorkDay: false, startTime: "09:00", endTime: "17:00" };
                  const updateSchedule = (changes: Partial<typeof schedule>) => setForm((current) => ({
                    ...current,
                    workingSchedules: [
                      ...current.workingSchedules.filter((row) => row.dayOfWeek !== dayOfWeek),
                      { ...schedule, ...changes },
                    ],
                  }));
                  return (
                    <div key={dayOfWeek} className="grid items-center gap-3 rounded-md border bg-background p-3 sm:grid-cols-[110px_1fr_1fr]">
                      <Button type="button" variant={schedule.isWorkDay ? "default" : "outline"} onClick={() => updateSchedule({ isWorkDay: !schedule.isWorkDay })}>{label}</Button>
                      <Input aria-label={`Jam masuk ${label}`} type="time" disabled={!schedule.isWorkDay} value={schedule.startTime || "09:00"} onChange={(event) => updateSchedule({ startTime: event.target.value })} />
                      <Input aria-label={`Jam pulang ${label}`} type="time" disabled={!schedule.isWorkDay} value={schedule.endTime || "17:00"} onChange={(event) => updateSchedule({ endTime: event.target.value })} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Buat master shift dan jadwal karyawan melalui menu Shift setelah cabang disimpan.</p>
            )}
          </section>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button disabled={loading} onClick={onSubmit}>{loading ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
