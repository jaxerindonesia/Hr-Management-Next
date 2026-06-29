"use client";

import { ClipboardList } from "lucide-react";
import { RecentSubmission } from "./types";

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

type Props = {
  recentSubmissions: RecentSubmission[];
};

export default function RecentSubmissionsCard({ recentSubmissions }: Props) {
  return (
    <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold dark:text-white">Pengajuan Terbaru</h3>
      </div>
      {recentSubmissions.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Belum ada pengajuan</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left dark:border-gray-700">
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Karyawan</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Jenis</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Periode</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentSubmissions.map((submission) => (
                <tr key={submission.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 font-medium dark:text-white">{submission.user?.name ?? "-"}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-300">{submission.submissionType?.name ?? "-"}</td>
                  <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(submission.startDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" – "}
                    {new Date(submission.endDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor[submission.status] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {statusLabel[submission.status] ?? submission.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
