"use client";

import { CalendarClock } from "lucide-react";
import type { ExpiringTenantItem } from "./types";

type Props = {
  tenants: ExpiringTenantItem[];
};

function getBadgeClassName(daysRemaining: number | null) {
  if (daysRemaining === null) return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200";
  if (daysRemaining <= 14) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (daysRemaining <= 30) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
}

export default function ExpiringTenantsCard({ tenants }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-orange-500" />
        <div>
          <h3 className="font-semibold dark:text-white">Tenant Akan Berakhir</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tenant aktif dengan masa langganan paling dekat berakhir.
          </p>
        </div>
      </div>

      {tenants.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Belum ada tenant yang mendekati akhir langganan</p>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{tenant.companyName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tenant.subscriptionEnd
                    ? new Date(tenant.subscriptionEnd).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Belum ada tanggal akhir"}
                  {" · "}
                  {tenant.employeeCount} karyawan
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClassName(tenant.daysRemaining)}`}>
                {tenant.daysRemaining === null ? "-" : `${tenant.daysRemaining} hari`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
