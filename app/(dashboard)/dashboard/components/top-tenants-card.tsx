"use client";

import { Building2 } from "lucide-react";
import { cn, DARK_GLASS_PANEL_CLASS } from "@/lib/utils";
import type { TopTenantItem } from "./types";

type Props = {
  tenants: TopTenantItem[];
};

export default function TopTenantsCard({ tenants }: Props) {
  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-6", DARK_GLASS_PANEL_CLASS)}>
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-500" />
        <div>
          <h3 className="font-semibold dark:text-white">Top Tenant</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tenant dengan skala organisasi terbesar untuk diprioritaskan.
          </p>
        </div>
      </div>

      {tenants.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Belum ada data tenant</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {tenants.map((tenant, index) => (
            <div
              key={tenant.id}
              className="rounded-xl border border-gray-100 px-4 py-4 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {index + 1}. {tenant.companyName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tenant.departmentCount} departemen
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {tenant.employeeCount} karyawan
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Karyawan Aktif
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                    {tenant.activeEmployeeCount}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-orange-700 dark:text-orange-300">
                    Rasio Aktif
                  </p>
                  <p className="mt-1 text-lg font-semibold text-orange-800 dark:text-orange-200">
                    {tenant.activeEmployeeRate}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
