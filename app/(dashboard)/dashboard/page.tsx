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
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Function to load data from localStorage
  const loadData = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("hr_user_data");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRole(user.role);
          setUserName(user.name);
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }

      const savedEmployees = localStorage.getItem("hr_employees");
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }

      // Load payrolls dari localStorage
      const savedPayrolls = localStorage.getItem("hr_payrolls");
      if (savedPayrolls) {
        setPayrolls(JSON.parse(savedPayrolls));
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

    // Set initial time on client side to avoid hydration mismatch
    setCurrentTime(new Date());

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

    // Parse YYYY-MM-DD explicitly to local time
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);

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
    <div className="space-y-6">
      {/* Waktu dan tanggal */}

      {/* Cards Statistik  yang di atas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === "Super Admin" && (
          <>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl ">
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

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
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
          </>
        )}

        {userRole === "Super Admin" && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
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
              <div className="w-12 h-12 flex items-center justify-center bg-purple-400/30 rounded-full">
                <span className="text-2xl font-bold text-purple-100">Rp</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* card pada Hari Libur & Event Mendatang */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
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
    </div>
  );
}
