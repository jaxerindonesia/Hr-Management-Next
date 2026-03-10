"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  CheckCircle,
  DollarSign,
  ClipboardList,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  UserPlus,
} from "lucide-react";

// ──────────────────────────────────
// Types
// ──────────────────────────────────
interface DashboardStats {
  totalKaryawan: number;
  karyawanAktif: number;
  pendingSubmissions: number;
  totalGajiBulanIni: number;
}

interface AttendancePoint {
  date: string;
  hadir: number;
  absen: number;
}

interface DeptDist {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface RecentSubmission {
  id: string;
  status: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  reason: string;
  user: { name: string };
  submissionType: { name: string };
}

interface NewEmployee {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  joinDate: string | null;
  status: string;
}

interface DashboardData {
  stats: DashboardStats;
  attendanceChart: AttendancePoint[];
  departmentDist: DeptDist[];
  recentSubmissions: RecentSubmission[];
  newEmployees: NewEmployee[];
}

// ──────────────────────────────────
// Helpers
// ──────────────────────────────────
const PIE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const generateHolidays = (year: number) => [
  { date: `${year}-01-01`, name: "Tahun Baru", type: "holiday" },
  { date: `${year}-01-29`, name: "Tahun Baru Imlek", type: "holiday" },
  { date: `${year}-03-22`, name: "Hari Raya Nyepi", type: "holiday" },
  { date: `${year}-03-31`, name: "Idul Fitri", type: "holiday" },
  { date: `${year}-04-01`, name: "Idul Fitri Hari Ke-2", type: "holiday" },
  { date: `${year}-04-18`, name: "Wafat Isa Al-Masih", type: "holiday" },
  { date: `${year}-05-01`, name: "Hari Buruh Internasional", type: "holiday" },
  { date: `${year}-05-29`, name: "Kenaikan Isa Al-Masih", type: "holiday" },
  { date: `${year}-06-01`, name: "Hari Lahir Pancasila", type: "holiday" },
  { date: `${year}-06-06`, name: "Idul Adha", type: "holiday" },
  { date: `${year}-06-27`, name: "Tahun Baru Islam", type: "holiday" },
  { date: `${year}-08-17`, name: "Hari Kemerdekaan RI", type: "holiday" },
  { date: `${year}-09-05`, name: "Maulid Nabi Muhammad SAW", type: "holiday" },
  { date: `${year}-12-25`, name: "Hari Raya Natal", type: "holiday" },
];

const getNextHolidays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const all = [...generateHolidays(year), ...generateHolidays(year + 1)];
  return all
    .map((h) => {
      const [y, m, d] = h.date.split("-").map(Number);
      const target = new Date(y, m - 1, d);
      target.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil(
        (target.getTime() - today.getTime()) / 86400000,
      );
      return { ...h, daysLeft };
    })
    .filter((h) => h.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(n)
    .replace("IDR", "Rp");

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Disetujui",
  rejected: "Ditolak",
};

// ──────────────────────────────────
// Sub-components
// ──────────────────────────────────
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
    <div
      className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient} shadow-lg`}
    >
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

// ──────────────────────────────────
// Main Page
// ──────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user_data");
    if (userData) {
      try {
        const u = JSON.parse(userData);
        setUserRole(u.role);
        setUserName(u.name);
      } catch (_) {}
    }

    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setData(res.data);
        else setError("Gagal memuat data dashboard.");
      })
      .catch(() => setError("Gagal terhubung ke server."))
      .finally(() => setLoading(false));

    return () => clearInterval(timer);
  }, []);

  const holidays = getNextHolidays();

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
      {/* ── Header greeting ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold dark:text-white">
          Selamat datang kembali,{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            {userName ?? "User"}
          </span>{" "}
          👋
        </h1>
        {currentTime && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentTime.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            &bull;{" "}
            {currentTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {userRole === "Super Admin" && (
          <>
            <StatCard
              title="Total Karyawan"
              value={stats.totalKaryawan}
              icon={Users}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              sub="Semua karyawan terdaftar"
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

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Bar Chart — spans 2 cols */}
        <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold dark:text-white">
              Absensi 7 Hari Terakhir
            </h3>
          </div>
          {attendanceChart.every((d) => d.hadir === 0 && d.absen === 0) ? (
            <div className="flex h-48 items-center justify-center text-gray-400 text-sm">
              Belum ada data absensi
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceChart} barSize={18} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(150,150,150,0.15)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(v) => (v === "hadir" ? "Hadir" : "Tidak Hadir")}
                />
                <Bar
                  dataKey="hadir"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Hadir"
                />
                <Bar
                  dataKey="absen"
                  fill="#f87171"
                  radius={[4, 4, 0, 0]}
                  name="Absen"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Pie Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold dark:text-white">
              Distribusi Departemen
            </h3>
          </div>
          {departmentDist.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-gray-400 text-sm">
              Belum ada data departemen
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={departmentDist}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {departmentDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Submissions */}
        <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold dark:text-white">Pengajuan Terbaru</h3>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              Belum ada pengajuan
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Karyawan
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Jenis
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Periode
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentSubmissions.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 font-medium dark:text-white">
                        {s.user?.name ?? "-"}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {s.submissionType?.name ?? "-"}
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(s.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" – "}
                        {new Date(s.endDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            statusColor[s.status] ??
                            "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {statusLabel[s.status] ?? s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column stack */}
        <div className="flex flex-col gap-6">
          {/* New Employees */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold dark:text-white">
                Karyawan Terbaru
              </h3>
            </div>
            {newEmployees.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">
                Belum ada karyawan
              </p>
            ) : (
              <ul className="space-y-3">
                {newEmployees.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                      {e.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium dark:text-white">
                        {e.name}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {e.position ?? "-"} · {e.department ?? "-"}
                      </p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {e.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming Holidays */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold dark:text-white">
                Hari Libur Mendatang
              </h3>
            </div>
            <ul className="space-y-2">
              {holidays.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-red-50 p-3 dark:bg-red-900/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {h.daysLeft === 0 ? "!" : h.daysLeft}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold dark:text-white">
                      {h.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {h.daysLeft === 0
                        ? "Hari ini!"
                        : h.daysLeft === 1
                          ? "Besok"
                          : `${h.daysLeft} hari lagi`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                    Libur
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
