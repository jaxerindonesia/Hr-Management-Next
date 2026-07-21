"use client";

import { ReceiptText } from "lucide-react";
import { cn, DARK_GLASS_PANEL_CLASS } from "@/lib/utils";
import type { RecentJournalItem } from "./types";

const statusColor: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  POSTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  VOID: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

type Props = {
  items: RecentJournalItem[];
};

export default function RecentJournalsCard({ items }: Props) {
  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-6", DARK_GLASS_PANEL_CLASS)}>
      <div className="mb-4 flex items-center gap-2">
        <ReceiptText className="h-5 w-5 text-violet-500" />
        <h3 className="font-semibold dark:text-white">Jurnal Terbaru</h3>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Belum ada jurnal</p>
      ) : (
        <div className="space-y-3">
          {items.map((journal) => (
            <div key={journal.id} className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{journal.journalNo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(journal.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {journal.totalLines} baris
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{journal.description || "-"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[journal.status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                  {journal.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
