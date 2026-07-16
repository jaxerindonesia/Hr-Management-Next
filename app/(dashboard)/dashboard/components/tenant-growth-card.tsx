"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { cn, DARK_GLASS_PANEL_CLASS } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TenantGrowthPoint } from "./types";

type Props = {
  monthlyData: TenantGrowthPoint[];
  yearlyData: TenantGrowthPoint[];
};

export default function TenantGrowthCard({ monthlyData, yearlyData }: Props) {
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const data = mode === "monthly" ? monthlyData : yearlyData;

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-6", DARK_GLASS_PANEL_CLASS)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-500" />
          <div>
            <h3 className="font-semibold dark:text-white">Tren Tenant & Karyawan</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mode === "monthly"
                ? "Pertumbuhan kumulatif 12 bulan terakhir."
                : "Pertumbuhan kumulatif per tahun."}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-40">
          <Select value={mode} onValueChange={(value) => setMode(value as "monthly" | "yearly")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-gray-400">
          Belum ada data pertumbuhan
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
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
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line type="monotone" dataKey="tenants" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} name="Tenant" />
            <Line type="monotone" dataKey="employees" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Karyawan" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
