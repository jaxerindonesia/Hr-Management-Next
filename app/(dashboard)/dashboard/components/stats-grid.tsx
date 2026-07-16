"use client";

import {
  Briefcase,
  Building2,
  CheckCircle,
  ClipboardList,
  Clock3,
  DollarSign,
  ReceiptText,
  Users,
} from "lucide-react";
import type { DashboardSummaryCard } from "./types";

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
  summaryCards: DashboardSummaryCard[];
};

const iconMap = {
  users: Users,
  check: CheckCircle,
  money: DollarSign,
  clipboard: ClipboardList,
  building: Building2,
  briefcase: Briefcase,
  receipt: ReceiptText,
  clock: Clock3,
} as const;

const gradientMap: Record<DashboardSummaryCard["tone"], string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-700",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700",
  orange: "bg-gradient-to-br from-orange-500 to-orange-700",
  violet: "bg-gradient-to-br from-purple-500 to-purple-700",
  teal: "bg-gradient-to-br from-cyan-500 to-cyan-700",
};

export default function StatsGrid({ summaryCards }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = iconMap[card.icon];

        return (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={Icon}
            gradient={gradientMap[card.tone]}
            sub={card.sub}
          />
        );
      })}
    </div>
  );
}
