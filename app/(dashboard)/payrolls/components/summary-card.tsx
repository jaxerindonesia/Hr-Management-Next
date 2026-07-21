"use client";

import { formatAmount } from "@/lib/helper/format-currency";
import { ComponentType } from "react";

export default function SummaryCard({
    label,
    value,
    subtitle,
    tone,
    icon: Icon,
}: {
    label: string;
    value: number;
    subtitle: string;
    tone: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <div className={`rounded-[18px] p-5 bg-${tone}-500 text-white`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[14px] font-semibold opacity-95">{label}</p>
                    <p className="mt-2 text-[24px] font-bold">
                        {formatAmount(value)}
                    </p>
                    <p className="mt-1 text-[14px] opacity-90">{subtitle}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
