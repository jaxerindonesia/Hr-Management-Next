"use client";

import type { ComponentType, ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, BarChart3, BookOpen, FileText, Layers3, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FinanceSummaryDto } from "@/lib/dto/finance";
import { formatCurrency } from "@/lib/helper/format-currency";

type Props = {
  summary: FinanceSummaryDto | null;
};

const STATUS_COLORS: Record<string, string> = {
  POSTED: "#2563eb",
  DRAFT: "#f97316",
  VOID: "#ef4444",
};

export default function FinanceDashboardPage({ summary }: Props) {
  const trendData = summary?.monthlyTrend ?? [];
  const statusData = summary?.statusBreakdown ?? [];
  const topRevenueAccounts = summary?.topRevenueAccounts ?? [];
  const topReceivableAccounts = summary?.topReceivableAccounts ?? [];
  const topPayableAccounts = summary?.topPayableAccounts ?? [];
  const topExpenseAccounts = summary?.topExpenseAccounts ?? [];

  return (
    <div className="space-y-4">
      <section>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-slate-950 dark:text-white">
              Ringkasan Keuangan Utama
            </h2>
            <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
              Sorotan cepat untuk pengambilan keputusan lebih cepat.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-3 text-blue-600 dark:border-gray-800">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <InsightCard
            label="Pendapatan"
            value={Math.abs(summary?.revenueBalance ?? 0)}
            tone="emerald"
            icon={ArrowUpRight}
            caption="Akun revenue aktif"
          />
          <InsightCard
            label="Kas / Bank"
            value={summary?.cashBankBalance ?? 0}
            tone="blue"
            icon={Banknote}
            caption="Likuiditas tersedia"
          />
          <InsightCard
            label="Piutang"
            value={summary?.receivableBalance ?? 0}
            tone="teal"
            icon={ArrowUpRight}
            caption="Tagihan belum tertagih"
          />
          <InsightCard
            label="Utang"
            value={summary?.payableBalance ?? 0}
            tone="orange"
            icon={ArrowDownLeft}
            caption="Kewajiban yang harus dibayar"
          />
          <InsightCard
            label="Laba / Rugi"
            value={Math.abs(summary?.profitLossBalance ?? 0)}
            tone="violet"
            icon={TrendingUp}
            caption={summary && summary.profitLossBalance >= 0 ? "Positif" : "Negatif"}
            positive={(summary?.profitLossBalance ?? 0) >= 0}
          />
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Layers3} label="Total Akun" value={summary?.accountCount ?? 0} tone="blue" />
        <MetricCard icon={FileText} label="Total Jurnal" value={summary?.journalCount ?? 0} tone="emerald" />
        <MetricCard icon={BookOpen} label="Jurnal Posted" value={summary?.postedJournalCount ?? 0} tone="violet" />
        <MetricCard icon={TrendingUp} label="Jurnal Draft" value={summary?.draftJournalCount ?? 0} tone="orange" />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <DashboardPanel
          title="Tren Debit / Credit"
          description="6 periode terakhir berdasarkan tanggal jurnal."
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
        >
          {trendData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={trendData} barCategoryGap={20} margin={{ top: 10, right: 12, left: -12, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={formatAxisCurrency}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <Tooltip content={<FinanceTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 16 }} iconType="square" />
                <Bar dataKey="debit" name="debit" fill="#2563eb" radius={[10, 10, 0, 0]} />
                <Bar dataKey="credit" name="credit" fill="#f97316" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Status Jurnal"
          description="Distribusi status transaksi finance."
          icon={<Layers3 className="h-5 w-5 text-blue-600" />}
        >
          {statusData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={76}
                    outerRadius={108}
                    paddingAngle={6}
                    stroke="none"
                  >
                    {statusData.map((item) => (
                      <Cell key={item.status} fill={STATUS_COLORS[item.status] ?? "#2563eb"} />
                    ))}
                  </Pie>
                  <Tooltip content={<FinanceTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center gap-3">
                {statusData.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/60"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] ?? "#2563eb" }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.status}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Status jurnal</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.total} jurnal</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardPanel>
      </div>

      <section className="grid gap-3 xl:grid-cols-2">
        <TopListPanel
          title="Top 5 Pendapatan"
          description="Akun revenue dengan kontribusi terbesar."
          items={topRevenueAccounts}
          tone="emerald"
        />
        <TopListPanel
          title="Top 5 Piutang"
          description="Tagihan terbesar yang belum tertagih."
          items={topReceivableAccounts}
          tone="blue"
        />
        <TopListPanel
          title="Top 5 Utang"
          description="Kewajiban terbesar yang perlu diprioritaskan."
          items={topPayableAccounts}
          tone="orange"
        />
        <TopListPanel
          title="Top 5 Beban"
          description="Akun biaya paling dominan pada periode berjalan."
          items={topExpenseAccounts}
          tone="violet"
        />
      </section>
    </div>
  );
}

function DashboardPanel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-3 text-blue-600 dark:border-gray-800">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[340px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-400 dark:border-gray-700 dark:bg-gray-950/20">
      Belum ada data untuk ditampilkan
    </div>
  );
}

function FinanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-950">
      {label ? <p className="mb-2 font-semibold text-slate-900 dark:text-white">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.name} className="flex items-center justify-between gap-6 text-slate-600 dark:text-slate-300">
            <span className="capitalize">{item.name}</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(Number(item.value || 0))}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "blue" | "emerald" | "violet" | "orange";
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
  };

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <div className={`rounded-2xl p-3 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-[18px] font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  tone,
  icon: Icon,
  caption,
  positive = true,
}: {
  label: string;
  value: number;
  tone: "blue" | "teal" | "emerald" | "orange" | "violet";
  icon: ComponentType<{ className?: string }>;
  caption: string;
  positive?: boolean;
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
    teal: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    orange: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
  };

  return (
    <div className={`rounded-[19px] p-[1px] ${toneClasses[tone]}`}>
      <div className="rounded-[18px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-2 text-[18px] font-semibold tracking-tight ${positive ? "text-slate-950 dark:text-white" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(value)}
            </p>
          </div>
          <div className={`rounded-2xl p-2 ring-1 ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">{caption}</p>
      </div>
    </div>
  );
}

function TopListPanel({
  title,
  description,
  items,
  tone,
}: {
  title: string;
  description: string;
  items: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
  }>;
  tone: "blue" | "emerald" | "violet" | "orange";
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    violet: "bg-violet-600",
    orange: "bg-orange-500",
  };

  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5">
        <h3 className="text-[16px] font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-400 dark:border-gray-700 dark:bg-gray-950/20">
            Belum ada data yang cukup untuk ditampilkan.
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/60"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white ${toneClasses[tone]}`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                    {item.code} - {item.name}
                  </p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Kontribusi akun</p>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(item.amount)}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function formatAxisCurrency(value: number) {
  if (value >= 1_000_000_000) return `${Math.round(value / 1_000_000_000)} M`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return `${value}`;
}
