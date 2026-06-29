"use client";

import { CheckCircle, ClipboardList, DollarSign, Users } from "lucide-react";
import { DashboardStats } from "./types";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(n)
    .replace("IDR", "Rp");

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  sub?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient} shadow-lg`}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-2 h-16 w-16 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
        </div>
        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

type Props = {
  canViewEmployeeStats: boolean;
  stats: DashboardStats;
  userRole: string | null;
};

export default function StatsGrid({ canViewEmployeeStats, stats, userRole }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {canViewEmployeeStats && (
        <>
          <StatCard
            title="Total Karyawan"
            value={stats.totalKaryawan}
            icon={Users}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            sub={userRole === "Super Admin" ? "Semua karyawan terdaftar" : "Karyawan di tenant Anda"}
          />
          <StatCard
            title="Karyawan Aktif"
            value={stats.karyawanAktif}
            icon={CheckCircle}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            sub={`${stats.totalKaryawan - stats.karyawanAktif} tidak aktif`}
          />
          <StatCard
            title="Total Gaji Bulan Ini"
            value={formatRp(stats.totalGajiBulanIni)}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
            sub="Sudah dibayar (paid)"
          />
        </>
      )}
      <StatCard
        title="Pengajuan Pending"
        value={stats.pendingSubmissions}
        icon={ClipboardList}
        gradient="bg-gradient-to-br from-orange-500 to-orange-700"
        sub="Menunggu persetujuan"
      />
    </div>
  );
}
