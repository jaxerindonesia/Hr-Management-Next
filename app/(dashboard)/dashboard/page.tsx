"use client";

import {
  Users,
  CheckCircle,
  Clock,
  Award,
  Calendar,
  Gift,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const initialLeaves = [
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

const initialPayrolls = [
  { id: "1", totalSalary: 15500000 },
  { id: "2", totalSalary: 12400000 },
];

const initialPerformances = [
  { id: "1", employeeName: "Surya", period: "Q1 2024", totalScore: 4.75 },
  { id: "2", employeeName: "Antoni", period: "Q1 2024", totalScore: 4.75 },
];

// Function untuk generate hari libur berdasarkan tahun berjalan
const generateHolidays = (year: number) => [
  { date: `${year}-01-01`, name: `Tahun Baru ${year}`, type: "holiday" },
  {
    date: `${year}-01-29`,
    name: "Tahun Baru Imlek (perkiraan)",
    type: "holiday",
  },
  { date: `${year}-02-14`, name: "Hari Valentine", type: "event" },
  {
    date: `${year}-03-22`,
    name: "Hari Raya Nyepi (perkiraan)",
    type: "holiday",
  },
  { date: `${year}-03-31`, name: "Idul Fitri (perkiraan)", type: "holiday" },
  {
    date: `${year}-04-01`,
    name: "Idul Fitri Hari Ke-2 (perkiraan)",
    type: "holiday",
  },
  { date: `${year}-04-18`, name: "Wafat Isa Al-Masih", type: "holiday" },
  { date: `${year}-05-01`, name: "Hari Buruh Internasional", type: "holiday" },
  { date: `${year}-05-29`, name: "Kenaikan Isa Al-Masih", type: "holiday" },
  { date: `${year}-06-01`, name: "Hari Lahir Pancasila", type: "holiday" },
  { date: `${year}-06-06`, name: "Idul Adha (perkiraan)", type: "holiday" },
  {
    date: `${year}-06-27`,
    name: "Tahun Baru Islam (perkiraan)",
    type: "holiday",
  },
  { date: `${year}-08-17`, name: "Hari Kemerdekaan RI", type: "holiday" },
  {
    date: `${year}-09-05`,
    name: "Maulid Nabi Muhammad SAW (perkiraan)",
    type: "holiday",
  },
  { date: `${year}-12-24`, name: "Malam Natal", type: "event" },
  { date: `${year}-12-25`, name: "Hari Raya Natal", type: "holiday" },
  { date: `${year}-12-31`, name: "Malam Tahun Baru", type: "event" },
];

// Data Ulang Tahun Karyawan
const upcomingBirthdays = [
  { id: "1", name: "Budi Santoso", date: "1990-01-25", department: "IT" },
  { id: "2", name: "Siti Nurhaliza", date: "1992-02-10", department: "HR" },
  { id: "3", name: "Ahmad Rizki", date: "1988-02-15", department: "Finance" },
  {
    id: "4",
    name: "Dewi Lestari",
    date: "1995-03-05",
    department: "Marketing",
  },
  {
    id: "5",
    name: "Andi Wijaya",
    date: "1991-03-18",
    department: "Operations",
  },
];

export default function DashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmployees = localStorage.getItem("hr_employees");
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }
    }

    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    return upcomingBirthdays
      .map((person) => {
        const birthDate = new Date(person.date);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate(),
        );

        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil(
          (thisYearBirthday.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return {
          ...person,
          daysUntil,
          date: birthDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
          }),
        };
      })
      .filter((person) => person.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
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
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">
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
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
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

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">
                Pengajuan Cuti
              </p>
              <p className="text-4xl font-bold mt-2">
                {initialLeaves.filter((l) => l.status === "pending").length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Total Gaji Bulan Ini
              </p>
              <p className="text-xl font-bold mt-2">
                {formatCurrency(
                  initialPayrolls.reduce((sum, p) => sum + p.totalSalary, 0),
                )}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-purple-400 bg-opacity-30 rounded-full">
              <span className="text-2xl font-bold text-purple-100">Rp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baris 1: Tanggal Merah & Ulang Tahun */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tanggal Merah & Event */}
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold">
              Hari Libur & Event Mendatang
            </h3>
          </div>
          <div className="space-y-3">
            {getNextHolidays().map((holiday, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100"
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
                    <p className="font-semibold text-gray-900">
                      {holiday.name}
                    </p>
                    <p className="text-sm text-gray-600">
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

        {/* Ulang Tahun Karyawan */}
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Ulang Tahun Karyawan</h3>
          </div>
          <div className="space-y-3">
            {getUpcomingBirthdays().length > 0 ? (
              getUpcomingBirthdays().map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      🎂
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {person.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {person.department} • {person.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-600">
                      {person.daysUntil === 0
                        ? "🎉 Hari ini!"
                        : person.daysUntil === 1
                          ? "Besok"
                          : `${person.daysUntil} hari lagi`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada ulang tahun dalam 30 hari ke depan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Baris 2: Pengajuan Cuti & Karyawan Terbaik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">Pengajuan Cuti Terbaru</h3>
          <div className="space-y-3">
            {initialLeaves.slice(0, 5).map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {leave.employeeName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {leave.type} - {leave.startDate}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    leave.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : leave.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">Karyawan Terbaik</h3>
          <div className="space-y-3">
            {initialPerformances
              .sort((a, b) => b.totalScore - a.totalScore)
              .slice(0, 5)
              .map((perf) => (
                <div
                  key={perf.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center">
                    <Award className="w-8 h-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {perf.employeeName}
                      </p>
                      <p className="text-sm text-gray-600">{perf.period}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {perf.totalScore}
                    </p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Produktivitas Tim</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Task Selesai Bulan Ini</p>
              <p className="text-2xl font-bold">87/100</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Pending Actions</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
