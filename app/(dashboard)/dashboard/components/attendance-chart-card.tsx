"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AttendancePoint } from "./types";

type Props = {
  attendanceChart: AttendancePoint[];
};

export default function AttendanceChartCard({ attendanceChart }: Props) {
  return (
    <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold dark:text-white">Absensi 7 Hari Terakhir</h3>
      </div>
      {attendanceChart.every((d) => d.hadir === 0 && d.absen === 0) ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
          Belum ada data absensi
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={attendanceChart} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f1f5f9",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => (v === "hadir" ? "Hadir" : "Tidak Hadir")} />
            <Bar dataKey="hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Hadir" />
            <Bar dataKey="absen" fill="#f87171" radius={[4, 4, 0, 0]} name="Absen" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
