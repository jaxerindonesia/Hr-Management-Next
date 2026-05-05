"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import FormData from "./components/form-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tenant = {
  id: string;
  companyName: string;
  adminEmail: string;
  isActive: boolean;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  createdAt: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState<Tenant | null>(null);
  const [userData, setUserData] = useState({ id: "", role: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(itemsPerPage));
      if (searchTerm) params.set("search", searchTerm);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/tenants?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data tenant");
      const json = await res.json();
      setTenants(json.data || []);
      setTotal(json.total || 0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal mengambil data tenant";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, status]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("hr_user_data") || "{}");
    setUserData(data);
  }, []);

  const handleOpenModal = (tenant?: Tenant) => {
    setEditingData(tenant || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingData(null);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus tenant");
      toast.success("Tenant berhasil dihapus");
      fetchTenants();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal menghapus tenant";
      toast.error(message);
    }
  };

  if (userData.role !== "Super Admin") {
    return (
      <div className="rounded-xl border bg-white dark:bg-gray-800 p-6 dark:border-gray-700">
        <p className="text-sm text-red-500">Halaman ini hanya bisa diakses oleh role Super Admin.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Tenant
            </Button>

            <div className="flex-1" />

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari company / email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Select
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger className="pl-4 pr-8 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white w-[180px]">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-semibold dark:text-gray-300">Nama Perusahaan</th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">Email Admin</th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">Status</th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">Mulai Langganan</th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">Akhir Langganan</th>
                  <th className="text-right p-3 font-semibold dark:text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">{tenant.companyName}</td>
                      <td className="p-3 dark:text-gray-300">{tenant.adminEmail}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${tenant.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                        >
                          {tenant.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {tenant.subscriptionStart
                          ? new Date(tenant.subscriptionStart).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        {tenant.subscriptionEnd
                          ? new Date(tenant.subscriptionEnd).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(tenant)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tenant.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{tenants.length}</span> dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{total}</span> data
              {totalPages > 0 && (
                <span>
                  {" "}— Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | "...")[] = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else if (currentPage <= 3) {
                      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
                    }
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm select-none">...</span>
                      ) : (
                        <button key={page} onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                          {page}
                        </button>
                      )
                    );
                  })()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <FormData initialData={editingData || undefined} onClose={handleCloseModal} onSuccess={fetchTenants} />
      )}
    </>
  );
}
