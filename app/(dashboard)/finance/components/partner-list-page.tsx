"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Partner = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tenantId: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  title: string;
  description: string;
  endpoint: "/api/finance/customers" | "/api/finance/vendors";
  searchPlaceholder?: string;
};

type PartnerFormState = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

type PaginatedResponse<T> = {
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
};

const ITEMS_PER_PAGE = 10;
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function PartnerListPage({
  title,
  description,
  endpoint,
  searchPlaceholder,
}: Props) {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PartnerFormState>({
    id: "",
    code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const json: PaginatedResponse<Partner> = await res.json();
      setItems(json.data || []);
      setTotal(json.total || 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Gagal mengambil data ${title.toLowerCase()}`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, endpoint, searchTerm, title]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (total === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, total, totalPages]);

  const openCreate = () => {
    setForm({ id: "", code: "", name: "", phone: "", email: "", address: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: Partner) => {
    setForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const code = form.code.trim();
      const name = form.name.trim();
      const email = form.email.trim().toLowerCase();

      if (!code) return toast.error("Code wajib diisi");
      if (!name) return toast.error("Name wajib diisi");
      if (!email) return toast.error("Email wajib diisi");
      if (!isValidEmail(email)) return toast.error("Email harus berupa alamat email yang valid");

      const payload = {
        code,
        name,
        phone: form.phone.trim() || null,
        email,
        address: form.address.trim() || null,
      };

      const res = await fetch(form.id ? `${endpoint}/${form.id}` : endpoint, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(json.message || `Data ${title.toLowerCase()} sudah ada`);
          return;
        }
        throw new Error(json.message || `Gagal menyimpan ${title.toLowerCase()}`);
      }

      toast.success(form.id ? `${title} berhasil diupdate` : `${title} berhasil ditambahkan`);
      setDialogOpen(false);
      setForm({ id: "", code: "", name: "", phone: "", email: "", address: "" });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Gagal menyimpan ${title.toLowerCase()}`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Gagal menghapus ${title.toLowerCase()}`);
      toast.success(`${title} berhasil dihapus`);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Gagal menghapus ${title.toLowerCase()}`;
      toast.error(message);
    }
  };

  const visiblePages = useMemo(() => {
    const pages: Array<number | "..."> = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <Button onClick={openCreate} className="flex w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
            <Plus className="h-4 w-4" /> Tambah {title}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder || `Cari ${title.toLowerCase()}...`}
              className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {items.length} dari {total} data
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Code</TableHead>
                <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Nama</TableHead>
                <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Telepon</TableHead>
                <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Email</TableHead>
                <TableHead className="text-left p-3 font-semibold dark:text-gray-300">Alamat</TableHead>
                <TableHead className="text-right p-3 font-semibold dark:text-gray-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="p-3 font-medium dark:text-white">{item.code}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{item.name}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{item.phone || "-"}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{item.email || "-"}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{item.address || "-"}</TableCell>
                    <TableCell className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Halaman {currentPage} dari {Math.max(totalPages, 1)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {visiblePages.map((page, index) =>
              page === "..." ? (
                <span key={`dots-${index}`} className="px-2 text-sm text-gray-400">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant="outline"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  {page}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? `Edit ${title}` : `Tambah ${title}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={save}>{form.id ? "Simpan Perubahan" : "Simpan"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
