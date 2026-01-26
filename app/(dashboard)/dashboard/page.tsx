"use client";

import {
  Users,
  CheckCircle,
  Clock,
  Award,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const defaultLeaves = [
  {
    id: "1",
    employeeName: "Budi Santoso",
    type: "Cuti",
    startDate: "2024-02-01",
    status: "pending",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    type: "Sakit",
    startDate: "2024-01-28",
    status: "approved",
  },
];

const defaultPerformances = [
  {
    id: "1",
    employeeName: "Budi Santoso",
    period: "Q1 2024",
    totalScore: 4.75,
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    period: "Q1 2024",
    totalScore: 4.75,
  },
];

// Function untuk generate hari libur berdasarkan tahun berjalan
const generateHolidays = (year: number) => [
  { date: `${year}-01-01`, name: `Tahun Baru ${year}`, type: "holiday" },
  {
    date: `${year}-01-29`,
    name: "Tahun Baru Imlek",
    type: "holiday",
  },
  { date: `${year}-02-14`, name: "Hari Valentine", type: "event" },
  {
    date: `${year}-03-22`,
    name: "Hari Raya Nyepi",
    type: "holiday",
  },
  { date: `${year}-03-31`, name: "Idul Fitri", type: "holiday" },
  {
    date: `${year}-04-01`,
    name: "Idul Fitri Hari Ke-2",
    type: "holiday",
  },
  { date: `${year}-04-18`, name: "Wafat Isa Al-Masih", type: "holiday" },
  { date: `${year}-05-01`, name: "Hari Buruh Internasional", type: "holiday" },
  { date: `${year}-05-29`, name: "Kenaikan Isa Al-Masih", type: "holiday" },
  { date: `${year}-06-01`, name: "Hari Lahir Pancasila", type: "holiday" },
  { date: `${year}-06-06`, name: "Idul Adha", type: "holiday" },
  {
    date: `${year}-06-27`,
    name: "Tahun Baru Islam",
    type: "holiday",
  },
  { date: `${year}-08-17`, name: "Hari Kemerdekaan RI", type: "holiday" },
  {
    date: `${year}-09-05`,
    name: "Maulid Nabi Muhammad SAW",
    type: "holiday",
  },
  { date: `${year}-12-24`, name: "Malam Natal", type: "event" },
  { date: `${year}-12-25`, name: "Hari Raya Natal", type: "holiday" },
  { date: `${year}-12-31`, name: "Malam Tahun Baru", type: "event" },
];

export default function DashboardPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<typeof defaultLeaves>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [performances, setPerformances] = useState<typeof defaultPerformances>(
    [],
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  // Function to load data from localStorage
  const loadData = () => {
    if (typeof window !== "undefined") {
      const savedEmployees = localStorage.getItem("hr_employees");
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }

      // Load leaves dari localStorage
      const savedLeaves = localStorage.getItem("hr_leaves");
      if (savedLeaves) {
        setLeaves(JSON.parse(savedLeaves));
      } else {
        setLeaves(defaultLeaves);
      }

      // Load payrolls dari localStorage
      const savedPayrolls = localStorage.getItem("hr_payrolls");
      if (savedPayrolls) {
        setPayrolls(JSON.parse(savedPayrolls));
      }

      // Load performances dari localStorage
      const savedPerformances = localStorage.getItem("hr_performances");
      if (savedPerformances) {
        setPerformances(JSON.parse(savedPerformances));
      } else {
        setPerformances(defaultPerformances);
      }
    }
  };

  useEffect(() => {
    loadData();

    // Listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "hr_payrolls" ||
        e.key === "hr_employees" ||
        e.key === "hr_leaves" ||
        e.key === "hr_performances"
      ) {
        loadData();
      }
    };

    // Listen for custom update events
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("payrollUpdated", handleDataUpdate);
    window.addEventListener("performanceUpdated", handleDataUpdate);

    // Check for updates when window gains focus
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener("focus", handleFocus);

    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("payrollUpdated", handleDataUpdate);
      window.removeEventListener("performanceUpdated", handleDataUpdate);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      currencyDisplay: "code",
    })
      .format(amount)
      .replace("IDR", "Rp");
  };

  const calculateDaysLeft = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getNextHolidays = () => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Generate untuk tahun ini dan tahun depan
    const thisYearHolidays = generateHolidays(currentYear);
    const nextYearHolidays = generateHolidays(currentYear + 1);
    const allHolidays = [...thisYearHolidays, ...nextYearHolidays];

    return allHolidays
      .map((holiday) => ({
        ...holiday,
        daysLeft: calculateDaysLeft(holiday.date),
      }))
      .filter((holiday) => holiday.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 4);
  };

  return (
    <div className="space-y-6 p-5 w-full">
      {/* Header dengan Waktu Real-time */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentTime.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            - {currentTime.toLocaleTimeString("id-ID")}
          </p>
        </div>
      </div>

      {/* Cards Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Total Karyawan
              </p>
              <p className="text-4xl font-bold mt-2">{employees.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Karyawan Aktif
              </p>
              <p className="text-4xl font-bold mt-2">
                {employees.filter((e: any) => e.status === "active").length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">
                Pengajuan Cuti
              </p>
              <p className="text-4xl font-bold mt-2">
                {leaves.filter((l: any) => l.status === "pending").length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Total Gaji Bulan Ini
              </p>
              <p className="text-xl font-bold mt-2">
                {formatCurrency(
                  payrolls
                    .filter((p) => {
                      const currentMonth = new Date().getMonth();
                      const currentYear = new Date().getFullYear();
                      const monthNames = [
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
                      return (
                        p.month === monthNames[currentMonth] &&
                        p.year === currentYear &&
                        p.status === "paid"
                      );
                    })
                    .reduce((sum, p) => sum + p.totalSalary, 0),
                )}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-purple-400 bg-opacity-30 rounded-full">
              <span className="text-2xl font-bold text-purple-100">Rp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hari Libur & Event Mendatang */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold dark:text-white">
            Hari Libur & Event Mendatang
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getNextHolidays().map((holiday, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-100 dark:border-red-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    holiday.type === "holiday" ? "bg-red-500" : "bg-pink-500"
                  } text-white font-bold`}
                >
                  {holiday.daysLeft}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {holiday.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {holiday.daysLeft === 0
                      ? "Hari ini!"
                      : holiday.daysLeft === 1
                        ? "Besok"
                        : `${holiday.daysLeft} hari lagi`}
                  </p>
                </div>
              </div>
              {holiday.type === "holiday" ? (
                <div className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                  Libur
                </div>
              ) : (
                <div className="px-3 py-1 bg-pink-500 text-white text-xs font-medium rounded-full">
                  Event
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Baris 2: Pengajuan Cuti & Karyawan Terbaik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            Pengajuan Cuti Terbaru
          </h3>
          <div className="space-y-3">
            {leaves.length > 0 ? (
              leaves.slice(0, 5).map((leave: any) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between border-b dark:border-gray-700 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {leave.employeeName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {leave.type} - {leave.startDate}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      leave.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : leave.status === "rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {leave.status === "pending"
                      ? "Menunggu"
                      : leave.status === "approved"
                        ? "Disetujui"
                        : "Ditolak"}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Tidak ada pengajuan cuti</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            Karyawan Terbaik
          </h3>
          <div className="space-y-3">
            {performances.length > 0 ? (
              performances
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 5)
                .map((perf) => (
                  <div
                    key={perf.id}
                    className="flex items-center justify-between border-b dark:border-gray-700 pb-3 last:border-0"
                  >
                    <div className="flex items-center">
                      <Award className="w-8 h-8 text-yellow-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {perf.employeeName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {perf.period}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {perf.totalScore}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Score
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada data penilaian kinerja</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
