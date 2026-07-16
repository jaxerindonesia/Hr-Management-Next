"use client";

import { Smartphone } from "lucide-react";
import type { ActiveTenantItem } from "./types";

type Props = {
  tenants: ActiveTenantItem[];
};

export default function ActiveTenantsCard({ tenants }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-cyan-500" />
        <div>
          <h3 className="font-semibold dark:text-white">Tenant Paling Aktif</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Aktivitas 30 hari terakhir dari modul operasional utama.
          </p>
        </div>
      </div>

      {tenants.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Belum ada aktivitas tenant</p>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant, index) => (
            <div
              key={tenant.id}
              className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {index + 1}. {tenant.companyName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tenant.activityCount} total aktivitas
                  </p>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                  Aktif
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Absensi</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{tenant.attendanceCount}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Pengajuan</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{tenant.submissionCount}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Lembur</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{tenant.overtimeCount}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Reimburse</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{tenant.reimbursementCount}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Performance</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{tenant.performanceCount}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Task</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{tenant.taskCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
