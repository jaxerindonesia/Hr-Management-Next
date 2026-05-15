"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  Download,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AttendanceDto } from "@/lib/dto/attendance";
import DetailData from "./components/detail-data";
import { usePermission } from "@/lib/helper/check-role";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FaceRecognitionModal from "./components/face-recognition-modal";
import ModalAttendanceConfig from "./components/modal-attendance-config";

type AttendanceConfigState = {
  officeStartTime: string;
  officeEndTime: string;
  lateToleranceMinutes: number;
  workingDays: string[];
  isDefault?: boolean;
};

const DEFAULT_ATTENDANCE_CONFIG: AttendanceConfigState = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",
  lateToleranceMinutes: 15,
  workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  isDefault: true,
};

const LAST_GEO_STORAGE_KEY = "hr_last_geo_point";
const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

type SavedGeoPoint = {
  lat: number;
  lng: number;
  timestamp: number;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const p1 = toRad(aLat);
  const p2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function AttendancePage() {
  const { checkRole, checkRoleMulti } = usePermission();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceDto | null>(
    null,
  );
  const [userData, setUserData] = useState({ id: "", role: "", avatarUrl: "" });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDto[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateLabel, setCurrentDateLabel] = useState("");
  const [mounted, setMounted] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceDto | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showAttendanceConfig, setShowAttendanceConfig] = useState(false);
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfigState>(
    DEFAULT_ATTENDANCE_CONFIG,
  );
  const [locationReady, setLocationReady] = useState(false);
  const [locationChecking, setLocationChecking] = useState(true);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [locationWarning, setLocationWarning] = useState("");
  const isIOSBrowser =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Face recognition modal state
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceModalMode, setFaceModalMode] = useState<"check-in" | "check-out">("check-in");

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  const refreshLocationReadiness = useCallback(async () => {
    if (typeof window === "undefined") return;
    setLocationChecking(true);
    setLocationBlocked(false);
    if (!navigator.geolocation) {
      setLocationReady(false);
      setLocationChecking(false);
      setLocationBlocked(true);
      setLocationWarning("Perangkat tidak mendukung akses lokasi.");
      return;
    }

    try {
      const permissionName = "geolocation" as PermissionName;
      if (navigator.permissions?.query) {
        const perm = await navigator.permissions.query({ name: permissionName });
        if (perm.state === "denied") {
          setLocationReady(false);
          setLocationChecking(false);
          setLocationBlocked(true);
          setLocationWarning(
            "Lokasi belum diizinkan. Aktifkan izin lokasi di browser/perangkat.",
          );
          return;
        }
        if (perm.state === "prompt") {
          setLocationReady(false);
          setLocationChecking(false);
          setLocationWarning(
            "Lokasi belum diizinkan. Klik Check In/Out untuk memberikan izin lokasi.",
          );
          return;
        }
      }

      await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          ...LOCATION_OPTIONS,
          timeout: 5000,
        }),
      );

      setLocationReady(true);
      setLocationWarning("");
    } catch (error) {
      const geoError = error as GeolocationPositionError | undefined;
      if (geoError?.code === 1) {
        setLocationReady(false);
        setLocationBlocked(true);
        setLocationWarning(
          "Lokasi belum diizinkan. Aktifkan izin lokasi di browser/perangkat.",
        );
      } else if (isIOSBrowser) {
        // Safari iOS often needs user gesture before location becomes available.
        setLocationReady(true);
        setLocationBlocked(false);
        setLocationWarning("");
      } else {
        setLocationReady(false);
        setLocationWarning(
          "Lokasi belum aktif. Nyalakan GPS/lokasi perangkat terlebih dahulu.",
        );
      }
    } finally {
      setLocationChecking(false);
    }
  }, [isIOSBrowser]);

  const fetchAttendanceConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance-config");
      if (!res.ok) throw new Error("Gagal mengambil konfigurasi kehadiran");
      const json = await res.json();
      const config = json?.data || DEFAULT_ATTENDANCE_CONFIG;
      setAttendanceConfig({
        officeStartTime: config.officeStartTime || "09:00",
        officeEndTime: config.officeEndTime || "17:00",
        lateToleranceMinutes: Number(config.lateToleranceMinutes ?? 15),
        workingDays:
          Array.isArray(config.workingDays) && config.workingDays.length > 0
            ? config.workingDays
            : DEFAULT_ATTENDANCE_CONFIG.workingDays,
        isDefault: Boolean(json?.isDefault),
      });
    } catch {
      setAttendanceConfig(DEFAULT_ATTENDANCE_CONFIG);
    }
  }, []);

  const fetchAttendance = useCallback(
    async (user: { id: string; role: string }) => {
      try {
        if (!user?.id) return;

        if (["Super Admin", "Admin"].includes(user.role)) {
          // Server-side pagination for admin
          const params = new URLSearchParams();
          params.set("page", String(currentPage));
          params.set("limit", String(itemsPerPage));
          if (searchQuery) params.set("search", searchQuery);
          if (filterStatus !== "all") params.set("status", filterStatus);

          const res = await fetch(`/api/attendances?${params.toString()}`);
          if (!res.ok) throw new Error("Gagal mengambil data attendance");

          const json = await res.json();
          setAttendanceRecords(json.data || []);
          setTotal(json.total || 0);
        } else {
          // For regular users, fetch their own data (usually small)
          const res = await fetch(`/api/attendances/user/${user.id}`);
          if (!res.ok) throw new Error("Gagal mengambil data attendance");

          const json = await res.json();
          const data = json.data || [];
          setAttendanceRecords(data);
          setTotal(data.length);
        }
      } catch {
        toast.error("Gagal memuat data attendance");
      }
    },
    [currentPage, searchQuery, filterStatus],
  );

  const fetchTodayAttendance = useCallback(async (userId: string) => {
    try {
      if (!userId) return;
      const res = await fetch(`/api/attendances/user/${userId}`);
      if (!res.ok) throw new Error("Gagal mengambil data attendance hari ini");

      const json = await res.json();
      const allData = json.data || [];
      const todayStr = new Date().toISOString().split("T")[0];
      const today = allData.find((item: AttendanceDto) => {
        const itemDate = new Date(item.date).toISOString().split("T")[0];
        return itemDate === todayStr;
      });
      setTodayAttendance(today || null);
    } catch {
      setTodayAttendance(null);
    }
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      let allData: AttendanceDto[] = [];

      if (["Super Admin", "Admin"].includes(userData.role)) {
        const params = new URLSearchParams();
        params.set("limit", "999999");
        if (searchQuery) params.set("search", searchQuery);
        if (filterStatus !== "all") params.set("status", filterStatus);

        const res = await fetch(`/api/attendances?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil data untuk export");

        const json = await res.json();
        allData = json.data || [];
      } else {
        const res = await fetch(`/api/attendances/user/${userData.id}`);
        if (!res.ok) throw new Error("Gagal mengambil data untuk export");

        const json = await res.json();
        allData = json.data || [];
      }

      const XLSX = await import("xlsx");
      const statusExportLabel: Record<string, string> = {
        "On Time": "Tepat Waktu",
        Present: "Hadir",
        Late: "Terlambat",
        "Late - Present": "Telat - Hadir",
        "Late - Half Day": "Telat - Setengah Hari",
        Absent: "Tidak Hadir",
        "Half Day": "Setengah Hari",
      };

      const rows: Array<Record<string, string>> = allData.map((record) => {
        const tanggal = new Date(record.date).toLocaleDateString("id-ID", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const checkIn = record.checkIn
          ? new Date(record.checkIn).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "-";
        const checkOut = record.checkOut
          ? new Date(record.checkOut).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "-";

        const emp = ["Super Admin", "Admin"].includes(userData.role)
          ? record?.user?.name
          : "-";
        const row: Record<string, string> = {
          "Nama Karyawan": emp!,
          Tanggal: tanggal,
          "Check In": checkIn,
          "Check Out": checkOut,
          "Jam Kerja": record.workHours ?? "-",
          Status: statusExportLabel[record.status] || record.status,
          "Bukti Check In": record.checkInFaceImage ?? "-",
          "Bukti Check Out": record.checkOutFaceImage ?? "-",
        };

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kehadiran");

      // Auto column width
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const fileName = `data-kehadiran-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Berhasil mengexport ${allData.length} data kehadiran`);
    } catch {
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Raw check-in / check-out (called after face verified) ──────────────
  const doCheckIn = useCallback(async (faceCaptureBase64: string) => {
    try {
      if (!navigator.geolocation) {
        toast.error("Perangkat ini tidak mendukung akses lokasi");
        return;
      }

      const permissionName = "geolocation" as PermissionName;
      if (navigator.permissions?.query) {
        const perm = await navigator.permissions.query({ name: permissionName });
        if (perm.state === "denied") {
          toast.error(
            "Lokasi masih nonaktif. Aktifkan GPS dan izinkan akses lokasi terlebih dahulu.",
          );
          return;
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, LOCATION_OPTIONS),
      );

      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        toast.error("Lokasi tidak valid. Pastikan GPS aktif lalu coba lagi.");
        return;
      }

      if (accuracy > 1500) {
        toast.error(
          "Akurasi lokasi terlalu rendah. Nyalakan GPS presisi tinggi lalu coba lagi.",
        );
        return;
      }

      const nowTs = Date.now();
      const lastRaw = localStorage.getItem(LAST_GEO_STORAGE_KEY);
      if (lastRaw) {
        try {
          const last = JSON.parse(lastRaw) as SavedGeoPoint;
          const distanceKm = haversineKm(last.lat, last.lng, latitude, longitude);
          const hours = (nowTs - last.timestamp) / 3600000;
          const speedKmh = hours > 0 ? distanceKm / hours : Number.POSITIVE_INFINITY;

          if (hours <= 2 && speedKmh > 250) {
            toast.error(
              "Lokasi terdeteksi tidak wajar (indikasi fake GPS). Nonaktifkan fake GPS lalu coba lagi.",
            );
            return;
          }
        } catch {
          // Ignore invalid local cache
        }
      }

      const res = await fetch("/api/attendances/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          checkInLocation: { latitude, longitude, accuracy },
          faceCaptureBase64,
        }),
      });

      if (!res.ok) throw new Error();

      localStorage.setItem(
        LAST_GEO_STORAGE_KEY,
        JSON.stringify({
          lat: latitude,
          lng: longitude,
          timestamp: nowTs,
        } satisfies SavedGeoPoint),
      );

      toast.success("Berhasil Check In");
      fetchAttendance(userData);
      fetchTodayAttendance(userData.id);
    } catch {
      toast.error(
        "Gagal mengambil lokasi. Nyalakan lokasi/GPS lalu izinkan akses lokasi terlebih dahulu.",
      );
    }
  }, [userData, fetchAttendance, fetchTodayAttendance]);

  const doCheckOut = useCallback(async (faceCaptureBase64: string) => {
    try {
      if (!navigator.geolocation) {
        toast.error("Perangkat ini tidak mendukung akses lokasi");
        return;
      }

      const permissionName = "geolocation" as PermissionName;
      if (navigator.permissions?.query) {
        const perm = await navigator.permissions.query({ name: permissionName });
        if (perm.state === "denied") {
          toast.error(
            "Lokasi masih nonaktif. Aktifkan GPS dan izinkan akses lokasi terlebih dahulu.",
          );
          return;
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, LOCATION_OPTIONS),
      );

      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        toast.error("Lokasi tidak valid. Pastikan GPS aktif lalu coba lagi.");
        return;
      }

      if (accuracy > 1500) {
        toast.error(
          "Akurasi lokasi terlalu rendah. Nyalakan GPS presisi tinggi lalu coba lagi.",
        );
        return;
      }

      const nowTs = Date.now();
      const lastRaw = localStorage.getItem(LAST_GEO_STORAGE_KEY);
      if (lastRaw) {
        try {
          const last = JSON.parse(lastRaw) as SavedGeoPoint;
          const distanceKm = haversineKm(last.lat, last.lng, latitude, longitude);
          const hours = (nowTs - last.timestamp) / 3600000;
          const speedKmh = hours > 0 ? distanceKm / hours : Number.POSITIVE_INFINITY;

          if (hours <= 2 && speedKmh > 250) {
            toast.error(
              "Lokasi terdeteksi tidak wajar (indikasi fake GPS). Nonaktifkan fake GPS lalu coba lagi.",
            );
            return;
          }
        } catch {
          // Ignore invalid local cache
        }
      }

      const res = await fetch("/api/attendances/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          checkOutLocation: { latitude, longitude, accuracy },
          faceCaptureBase64,
        }),
      });
      if (!res.ok) throw new Error();

      localStorage.setItem(
        LAST_GEO_STORAGE_KEY,
        JSON.stringify({
          lat: latitude,
          lng: longitude,
          timestamp: nowTs,
        } satisfies SavedGeoPoint),
      );

      toast.success("Berhasil Check Out");
      fetchAttendance(userData);
      fetchTodayAttendance(userData.id);
    } catch {
      toast.error(
        "Gagal mengambil lokasi. Nyalakan lokasi/GPS lalu izinkan akses lokasi terlebih dahulu.",
      );
    }
  }, [userData, fetchAttendance, fetchTodayAttendance]);

  // ── Open face-recognition modal first ──────────────────────────────────
  const handleCheckIn = () => {
    const canProceed = !locationBlocked && (locationReady || isIOSBrowser);
    if (!canProceed) {
      toast.error(
        locationWarning ||
          "Lokasi belum aktif/diizinkan. Aktifkan lokasi terlebih dahulu.",
      );
      refreshLocationReadiness();
      return;
    }
    setFaceModalMode("check-in");
    setIsFaceModalOpen(true);
  };

  const handleCheckOut = () => {
    const canProceed = !locationBlocked && (locationReady || isIOSBrowser);
    if (!canProceed) {
      toast.error(
        locationWarning ||
          "Lokasi belum aktif/diizinkan. Aktifkan lokasi terlebih dahulu.",
      );
      refreshLocationReadiness();
      return;
    }
    setFaceModalMode("check-out");
    setIsFaceModalOpen(true);
  };

  const handleFaceSuccess = useCallback((captureDataUrl: string) => {
    if (!captureDataUrl) {
      toast.error("Gagal mengambil bukti foto, silakan ulangi scan wajah");
      return;
    }
    setIsFaceModalOpen(false);
    if (faceModalMode === "check-in") {
      doCheckIn(captureDataUrl);
    } else {
      doCheckOut(captureDataUrl);
    }
  }, [faceModalMode, doCheckIn, doCheckOut]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attendances/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Data berhasil dihapus");
      fetchAttendance(userData);
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setOpenPopoverId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
      case "On Time":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Late":
      case "Late - Present":
      case "Late - Half Day":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Absent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Half Day":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
      case "On Time":
        return <CheckCircle className="w-4 h-4" />;
      case "Late":
      case "Late - Present":
      case "Late - Half Day":
        return <Clock className="w-4 h-4" />;
      case "Absent":
        return <XCircle className="w-4 h-4" />;
      case "Half Day":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const statusLabel: Record<string, string> = {
    "On Time": "Tepat Waktu",
    Present: "Hadir",
    Late: "Terlambat",
    "Late - Present": "Telat - Hadir",
    "Late - Half Day": "Telat - Setengah Hari",
    Absent: "Tidak Hadir",
    "Half Day": "Setengah Hari",
  };
  const tableColSpan =
    6 +
    (["Super Admin", "Admin"].includes(userData.role) ? 1 : 0) +
    (checkRoleMulti("attendances", ["get-by-id", "delete"]) ? 1 : 0);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Fetch data when page or filters change
  useEffect(() => {
    if (userData.id) {
      fetchAttendance(userData);
      fetchAttendanceConfig();
      fetchTodayAttendance(userData.id);
    }
  }, [fetchAttendance, fetchAttendanceConfig, fetchTodayAttendance, userData]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData({
      id: data.id || "",
      role: data.role || "",
      avatarUrl: data.avatarUrl || data.avatar_url || "",
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    refreshLocationReadiness();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshLocationReadiness();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshLocationReadiness]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setCurrentDateLabel(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* LIVE TIME */}
              <div className="min-w-[185px] rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-3 py-2 shadow-sm dark:border-slate-600 dark:from-slate-800 dark:to-slate-700">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
                  {currentDateLabel}
                </div>
                <div className="mt-1 text-xl leading-none font-bold tracking-tight text-slate-900 dark:text-white">
                  {currentTime}
                </div>
                <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-600">
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {attendanceConfig.officeStartTime}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {attendanceConfig.officeEndTime}
                    </span>
                  </div>
                </div>
              </div>

              {checkRole("attendances", "create") && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                  {!todayAttendance ? (
                    <Button
                      onClick={handleCheckIn}
                      disabled={
                        locationChecking ||
                        locationBlocked ||
                        (!locationReady && !isIOSBrowser)
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                  ) : todayAttendance && !todayAttendance.checkOut ? (
                    <Button
                      onClick={handleCheckOut}
                      disabled={
                        locationChecking ||
                        locationBlocked ||
                        (!locationReady && !isIOSBrowser)
                      }
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Check Out
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="bg-gray-400 text-white cursor-not-allowed"
                    >
                      Sudah Absen Hari Ini
                    </Button>
                  )}
                  </div>
                  {locationChecking ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Memeriksa izin lokasi...
                    </p>
                  ) : !locationReady ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {locationWarning}
                    </p>
                  ) : null}
                </div>
              )}

              {["Super Admin", "Admin"].includes(userData.role) && (
                <Button
                  variant="outline"
                  onClick={() => setShowAttendanceConfig(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Konfigurasi Kehadiran
                </Button>
              )}
            </div>

            <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Filter */}
              <div className="relative">
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger className="pl-4 pr-8 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white w-[180px]">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="On Time">Tepat Waktu</SelectItem>
                    <SelectItem value="Present">Hadir</SelectItem>
                    <SelectItem value="Late">Terlambat</SelectItem>
                    <SelectItem value="Late - Present">Telat - Hadir</SelectItem>
                    <SelectItem value="Late - Half Day">Telat - Setengah Hari</SelectItem>
                    <SelectItem value="Absent">Tidak Hadir</SelectItem>
                    <SelectItem value="Half Day">Setengah Hari</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              {checkRole("attendances", "export") && (
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="outline"
                  className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Mengexport..." : "Export Excel"}
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {["Super Admin", "Admin"].includes(userData.role) && (
                    <th className="text-left p-3 font-semibold dark:text-gray-300">
                      Nama Karyawan
                    </th>
                  )}
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Tanggal
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Check In
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Check Out
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Jam Kerja
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Bukti
                  </th>
                  {checkRoleMulti("attendances", ["get-by-id", "delete"]) && (
                    <th className="text-right p-3 font-semibold dark:text-gray-300">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {["Super Admin", "Admin"].includes(userData.role) && (
                        <td className="p-3 dark:text-gray-300">
                          {record?.user?.name}
                        </td>
                      )}
                      <td className="p-3 font-medium dark:text-white">
                        {new Date(record.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleDateString(
                            "id-ID",
                            {
                              minute: "2-digit",
                              hour: "2-digit",
                            },
                          )
                          : "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleDateString(
                            "id-ID",
                            {
                              minute: "2-digit",
                              hour: "2-digit",
                            },
                          )
                          : "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300 font-medium">
                        {record.workHours}
                      </td>

                      <td className="p-3 dark:text-gray-300">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            record.status,
                          )}`}
                        >
                          {getStatusIcon(record.status)}
                          {statusLabel[record.status] || record.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {record.checkInFaceImage ? (
                            <a
                              href={record.checkInFaceImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                              title="Bukti Check In"
                            >
                              <img
                                src={record.checkInFaceImage}
                                alt="Bukti check in"
                                className="w-10 h-10 rounded object-cover border"
                              />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">CI: -</span>
                          )}
                          {record.checkOutFaceImage ? (
                            <a
                              href={record.checkOutFaceImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                              title="Bukti Check Out"
                            >
                              <img
                                src={record.checkOutFaceImage}
                                alt="Bukti check out"
                                className="w-10 h-10 rounded object-cover border"
                              />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">CO: -</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {checkRole("attendances", "get-by-id") && (
                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {checkRole("attendances", "delete") && (
                            <Popover
                              open={openPopoverId === record.id}
                              onOpenChange={(open) =>
                                setOpenPopoverId(open ? record.id : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus data ini?
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOpenPopoverId(null)}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(record.id)}
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
                      colSpan={tableColSpan}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Tidak ada data kehadiran yang ditemukan
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
                {attendanceRecords.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {total}
              </span>{" "}
              kehadiran
              {totalPages > 0 && (
                <span>
                  {" "}
                  — Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>

            {totalPages > 1 && (
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
                  {(() => {
                    const pages: (number | "...")[] = [];
                    if (totalPages <= 5) {
                      // Tampilkan semua jika <= 5 halaman
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else if (currentPage <= 3) {
                      // Di awal: 1 2 3 ... last-1 last
                      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      // Di akhir: 1 2 ... last-2 last-1 last
                      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      // Di tengah: 1 ... prev current next ... last
                      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
                    }
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm select-none"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    );
                  })()}
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
            )}
          </div>
        </div>
      </div>

      {selectedRecord && (
        <DetailData
          initialData={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      <FaceRecognitionModal
        isOpen={isFaceModalOpen}
        mode={faceModalMode}
        referenceImageUrl={userData.avatarUrl || null}
        onSuccess={handleFaceSuccess}
        onClose={() => setIsFaceModalOpen(false)}
      />

      {showAttendanceConfig && (
        <ModalAttendanceConfig
          onClose={() => {
            setShowAttendanceConfig(false);
            fetchAttendance(userData);
          }}
          onSaved={fetchAttendanceConfig}
        />
      )}
    </>
  );
}
