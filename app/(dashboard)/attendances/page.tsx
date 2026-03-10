"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  Download,
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

export default function AttendancePage() {
  const { checkRole, checkRoleMulti } = usePermission();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceDto | null>(
    null,
  );
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDto[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState("");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceDto | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  const fetchAttendance = useCallback(
    async (user: any) => {
      try {
        if (!user?.id) return;

        if (user.role === "Super Admin") {
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

        // Check today's attendance (separate call without pagination)
        const todayRes = await fetch(
          user.role === "Super Admin"
            ? `/api/attendances?limit=999`
            : `/api/attendances/user/${user.id}`,
        );
        if (todayRes.ok) {
          const todayJson = await todayRes.json();
          const allData = todayJson.data || [];
          const todayStr = new Date().toISOString().split("T")[0];
          const today = allData.find((item: AttendanceDto) => {
            const itemDate = new Date(item.date).toISOString().split("T")[0];
            return itemDate === todayStr;
          });
          setTodayAttendance(today || null);
        }
      } catch (err) {
        toast.error("Gagal memuat data attendance");
      }
    },
    [currentPage, searchQuery, filterStatus],
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);

      let allData: AttendanceDto[] = [];

      if (userData.role === "Super Admin") {
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

      const rows = allData.map((record) => {
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

        if (userData.role === "Super Admin") {
          return {
            "Nama Karyawan": record?.user?.name ?? "-",
            Tanggal: tanggal,
            "Check In": checkIn,
            "Check Out": checkOut,
            "Jam Kerja": record.workHours ?? "-",
            Status: record.status,
          };
        }
        return {
          Tanggal: tanggal,
          "Check In": checkIn,
          "Check Out": checkOut,
          "Jam Kerja": record.workHours ?? "-",
          Status: record.status,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kehadiran");

      // Auto column width
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String((r as any)[key] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const fileName = `data-kehadiran-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Berhasil mengexport ${allData.length} data kehadiran`);
    } catch (err) {
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation tidak didukung browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const userId = userData.id;
          const res = await fetch("/api/attendances/check-in", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              checkInLocation: {
                latitude,
                longitude,
              },
            }),
          });

          if (!res.ok) throw new Error();

          toast.success("Berhasil Check In");
          fetchAttendance(userData);
        },
        () => {
          toast.error("Gagal mendapatkan lokasi");
        },
      );
    } catch (err) {
      toast.error("Gagal Check In");
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation tidak didukung browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const userId = userData.id;
          const res = await fetch("/api/attendances/check-out", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              checkOutLocation: {
                latitude,
                longitude,
              },
            }),
          });

          if (!res.ok) throw new Error();

          toast.success("Berhasil Check Out");
          fetchAttendance(userData);
        },
        () => {
          toast.error("Gagal mendapatkan lokasi");
        },
      );
    } catch (err) {
      toast.error("Gagal Check Out");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attendances/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Data berhasil dihapus");
      fetchAttendance(userData);
    } catch (err) {
      toast.error("Gagal menghapus data");
    } finally {
      setOpenPopoverId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Late":
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
        return <CheckCircle className="w-4 h-4" />;
      case "Late":
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
    Present: "Hadir",
    Late: "Terlambat",
    Absent: "Tidak Hadir",
    "Half Day": "Setengah Hari",
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Fetch data when page or filters change
  useEffect(() => {
    if (userData.id) {
      fetchAttendance(userData);
    }
  }, [fetchAttendance, userData]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

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
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {/* LIVE TIME */}
            <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 border dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white tracking-wide">
                {currentTime}
              </div>
            </div>

            {checkRole("attendances", "create") && (
              <>
                {/* AUTO SWITCH BUTTON */}
                <div className="flex gap-2">
                  {!todayAttendance ? (
                    <Button
                      onClick={handleCheckIn}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                  ) : todayAttendance && !todayAttendance.checkOut ? (
                    <Button
                      onClick={handleCheckOut}
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

                <div className="flex-1" />
              </>
            )}

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
                  <SelectItem value="Present">Hadir</SelectItem>
                  <SelectItem value="Late">Terlambat</SelectItem>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {userData.role === "Super Admin" && (
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
                      {userData.role === "Super Admin" && (
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
                      colSpan={7}
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
    </>
  );
}
