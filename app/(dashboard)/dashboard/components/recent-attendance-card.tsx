"use client";

import { Clock3 } from "lucide-react";
import type { RecentAttendanceItem } from "./types";

type Props = {
  items: RecentAttendanceItem[];
};

export default function RecentAttendanceCard({ items }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold dark:text-white">Absensi Terbaru</h3>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Belum ada riwayat absensi</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(item.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Masuk: {item.checkIn ? new Date(item.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    {" · "}
                    Keluar: {item.checkOut ? new Date(item.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
