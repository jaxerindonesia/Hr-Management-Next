"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    { id: "employees", name: "Data Karyawan", icon: Users, path: "/employees" },
    { id: "leaves", name: "Cuti/Izin", icon: Calendar, path: "/leaves" },
    {
      id: "payroll",
      name: "Payroll",
      icon: () => <span className="text-lg font-bold">Rp</span>,
      path: "/payroll",
    },
    {
      id: "performance",
      name: "Penilaian Kinerja",
      icon: TrendingUp,
      path: "/performance",
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${sidebarOpen ? "w-64" : "w-20"}`}
    >
      <div className="p-6 flex items-center justify-between border-b border-gray-200">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">HR System</h1>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto">
            <Users className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-gray-500"}`}
              />
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex justify-center items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
