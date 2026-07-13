"use client";

import { Calendar } from "lucide-react";
import { HolidayItem } from "./types";

type Props = {
  holidays: HolidayItem[];
  holidaysLoading: boolean;
};

export default function UpcomingHolidaysCard({ holidays, holidaysLoading }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-red-500" />
        <h3 className="font-semibold dark:text-white">Hari Libur Mendatang</h3>
      </div>
      {holidaysLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
        </div>
      ) : holidays.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Tidak ada data hari libur</p>
      ) : (
        <ul className="space-y-2">
          {holidays.map((holiday, index) => (
            <li key={index} className="flex items-center gap-3 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {holiday.daysLeft === 0 ? "!" : holiday.daysLeft}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold dark:text-white">{holiday.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(`${holiday.date}T00:00:00`).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {" · "}
                  {holiday.daysLeft === 0 ? "Hari ini!" : holiday.daysLeft === 1 ? "Besok" : `${holiday.daysLeft} hari lagi`}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                Libur
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
