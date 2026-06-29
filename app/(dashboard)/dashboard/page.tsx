"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import AttendanceChartCard from "./components/attendance-chart-card";
import DashboardHeader from "./components/dashboard-header";
import DepartmentChartCard from "./components/department-chart-card";
import NewEmployeesCard from "./components/new-employees-card";
import RecentSubmissionsCard from "./components/recent-submissions-card";
import StatsGrid from "./components/stats-grid";
import type { DashboardData, HolidayItem, TenantConfig } from "./components/types";
import UpcomingHolidaysCard from "./components/upcoming-holidays-card";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [tenantName, setTenantName] = useState("perusahaan Anda");
  const [userRole] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("hr_user_data");
      if (!raw) return null;
      return JSON.parse(raw)?.role ?? null;
    } catch {
      return null;
    }
  });
  const [userName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("hr_user_data");
      if (!raw) return null;
      return JSON.parse(raw)?.name ?? null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setData(res.data);
        else setError("Gagal memuat data dashboard.");
      })
      .catch(() => setError("Gagal terhubung ke server."))
      .finally(() => setLoading(false));

    fetch("/api/holidays")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setHolidays(res.data);
      })
      .catch(() => { })
      .finally(() => setHolidaysLoading(false));

    fetch("/api/tenant-config")
      .then((r) => r.json())
      .then((res: { data?: TenantConfig | null }) => {
        const companyName = res.data?.companyName?.trim();
        if (companyName) {
          setTenantName(companyName);
        }
      })
      .catch(() => {});
  }, []);
  const canViewEmployeeStats =
    userRole === "Super Admin" || userRole === "Admin";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm text-gray-400">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-red-400">
          <AlertCircle className="h-10 w-10" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const {
    stats,
    attendanceChart,
    departmentDist,
    recentSubmissions,
    newEmployees,
  } = data!;

  return (
    <div className="space-y-6">
      <DashboardHeader tenantName={tenantName} userName={userName} />

      <StatsGrid canViewEmployeeStats={canViewEmployeeStats} stats={stats} userRole={userRole} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceChartCard attendanceChart={attendanceChart} />
        <DepartmentChartCard departmentDist={departmentDist} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentSubmissionsCard recentSubmissions={recentSubmissions} />
        <div className="flex flex-col gap-6">
          <NewEmployeesCard newEmployees={newEmployees} />
          <UpcomingHolidaysCard holidays={holidays} holidaysLoading={holidaysLoading} />
        </div>
      </div>
    </div>
  );
}
