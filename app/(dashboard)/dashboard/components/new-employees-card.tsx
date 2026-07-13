"use client";

import { UserPlus } from "lucide-react";
import { NewEmployee } from "./types";

type Props = {
  newEmployees: NewEmployee[];
};

export default function NewEmployeesCard({ newEmployees }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-emerald-500" />
        <h3 className="font-semibold dark:text-white">Karyawan Terbaru</h3>
      </div>
      {newEmployees.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Belum ada karyawan</p>
      ) : (
        <ul className="space-y-3">
          {newEmployees.map((employee) => (
            <li key={employee.id} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium dark:text-white">{employee.name}</p>
                <p className="truncate text-xs text-gray-400">
                  {employee.position ?? "-"} · {employee.department ?? "-"}
                </p>
              </div>
              <span
                className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  employee.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {employee.status === "active" ? "Aktif" : "Nonaktif"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
