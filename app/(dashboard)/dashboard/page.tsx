"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import ActiveTenantsCard from "./components/active-tenants-card";
import AttendanceChartCard from "./components/attendance-chart-card";
import DashboardHeader from "./components/dashboard-header";
import DepartmentChartCard from "./components/department-chart-card";
import ExpiringTenantsCard from "./components/expiring-tenants-card";
import NewEmployeesCard from "./components/new-employees-card";
import RecentAttendanceCard from "./components/recent-attendance-card";
import RecentJournalsCard from "./components/recent-journals-card";
import RecentSubmissionsCard from "./components/recent-submissions-card";
import StatsGrid from "./components/stats-grid";
import TenantGrowthCard from "./components/tenant-growth-card";
import TopTenantsCard from "./components/top-tenants-card";
import type { DashboardData, HolidayItem } from "./components/types";
import UpcomingHolidaysCard from "./components/upcoming-holidays-card";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
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
  }, []);

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
    roleKey,
    subtitle,
    summaryCards,
    attendanceChart,
    departmentDist,
    recentSubmissions,
    newEmployees,
    topTenants,
    activeTenants,
    expiringTenants,
    tenantGrowthMonthly,
    tenantGrowthYearly,
    recentAttendances,
    recentJournals,
  } = data!;

  return (
    <div className="space-y-4">
      <DashboardHeader userName={userName} subtitle={subtitle} />

      <StatsGrid summaryCards={summaryCards} />

      {(roleKey === "admin" || roleKey === "employee") && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AttendanceChartCard attendanceChart={attendanceChart} />
          {roleKey === "admin" ? (
            <DepartmentChartCard departmentDist={departmentDist} />
          ) : (
            <RecentAttendanceCard items={recentAttendances} />
          )}
        </div>
      )}

      {roleKey === "super_admin" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TenantGrowthCard monthlyData={tenantGrowthMonthly} yearlyData={tenantGrowthYearly} />
            </div>
            <ExpiringTenantsCard tenants={expiringTenants} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopTenantsCard tenants={topTenants} />
            <ActiveTenantsCard tenants={activeTenants} />
          </div>
        </>
      )}

      {roleKey === "admin" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecentSubmissionsCard recentSubmissions={recentSubmissions} />
          <div className="flex flex-col gap-6">
            <NewEmployeesCard newEmployees={newEmployees} />
            <UpcomingHolidaysCard holidays={holidays} holidaysLoading={holidaysLoading} />
          </div>
        </div>
      )}

      {roleKey === "employee" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecentSubmissionsCard recentSubmissions={recentSubmissions} />
          <UpcomingHolidaysCard holidays={holidays} holidaysLoading={holidaysLoading} />
        </div>
      )}

      {roleKey === "finance" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentJournalsCard items={recentJournals} />
          </div>
          <UpcomingHolidaysCard holidays={holidays} holidaysLoading={holidaysLoading} />
        </div>
      )}
    </div>
  );
}
