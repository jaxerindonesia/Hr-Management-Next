"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceDto } from "@/lib/dto/performance";
import { toast } from "sonner";
import FormData from "./components/form-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PerformancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [performances, setPerformances] = useState<PerformanceDto[]>([]);
  const [formData, setFormData] = useState<PerformanceDto>({
    userId: "",
    period: "",
    productivity: 0,
    quality: 0,
    teamwork: 0,
    discipline: 0,
    notes: "",
    totalScore: 0,
    evaluatedBy: "",
  });

  // Filter states>
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const itemsPerPage = 5;

  // Get unique periods
  const uniquePeriods = Array.from(
    new Set(performances.map((p) => p.period))
  ).sort();

  const clearAllFilters = () => {
    setFilterPeriod("all");
    setFilterScore("all");
    setSearchTerm("");
  };

  const activeFilterCount = [
    filterPeriod !== "all",
    filterScore !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  const filteredPerformances = performances.filter(
    (perf) => {
      const matchesSearch = 
        perf.period.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPeriod = filterPeriod === "all" || perf.period === filterPeriod;
      
      let matchesScore = true;
      if (filterScore === "excellent") matchesScore = perf.totalScore >= 4.5;
      else if (filterScore === "good") matchesScore = perf.totalScore >= 3.5 && perf.totalScore < 4.5;
      else if (filterScore === "fair") matchesScore = perf.totalScore >= 2.5 && perf.totalScore < 3.5;
      else if (filterScore === "poor") matchesScore = perf.totalScore < 2.5;

      return matchesSearch && matchesPeriod && matchesScore;
    }
  );

  const totalPages = Math.ceil(filteredPerformances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPerformances = filteredPerformances.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const calculateTotalScore = (
    prod: number,
    qual: number,
    team: number,
    disc: number,
  ) => {
    return ((prod + qual + team + disc) / 4).toFixed(2);
  };

  const handleOpenModal = (data?: PerformanceDto) => {
    if (data) setFormData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      userId: "",
      period: "",
      productivity: 0,
      quality: 0,
      teamwork: 0,
      discipline: 0,
      notes: "",
      totalScore: 0,
      evaluatedBy: "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/performances/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus penilaian");
      toast.success("Penilaian berhasil dihapus!");
      fetchPerformances();
    } catch (error) {
      toast.error("Gagal menghapus penilaian");
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={
            i < rating
              ? "text-yellow-400 dark:text-yellow-300"
              : "text-gray-300 dark:text-gray-600"
          }
        >
          ★
        </span>
      ))}
    </div>
  );

  const fetchPerformances = async () => {
    try {
      const res = await fetch("/api/performances");
      if (!res.ok) throw new Error("Gagal mengambil data kinerja");
      const json = await res.json();
      setPerformances(json.data || []);
    } catch (err) {
      toast.error("Gagal mengambil data kinerja");
    }
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPeriod, filterScore]);

  useEffect(() => {
    fetchPerformances();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Penilaian
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilterPanel || activeFilterCount > 0
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilterPanel && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Filter Data Kinerja
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Hapus Semua Filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Cari
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nama karyawan atau periode"
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Periode
                  </label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Periode</option>
                    {uniquePeriods.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Nilai Kinerja
                  </label>
                  <select
                    value={filterScore}
                    onChange={(e) => setFilterScore(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Nilai</option>
                    <option value="excellent">Sangat Baik (≥ 4.5)</option>
                    <option value="good">Baik (3.5 - 4.49)</option>
                    <option value="fair">Cukup (2.5 - 3.49)</option>
                    <option value="poor">Kurang (&lt; 2.5)</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Cari: {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterPeriod !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Periode: {filterPeriod}
                      <button
                        onClick={() => setFilterPeriod("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterScore !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      Nilai: {filterScore}
                      <button
                        onClick={() => setFilterScore("all")}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Nama Karyawan
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Periode
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Produktivitas
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Kualitas
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Kerjasama
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Disiplin
                  </th>
                  <th className="text-left p-3 font-semibold dark:text-gray-300">
                    Total Score
                  </th>
                  <th className="text-right p-3 font-semibold dark:text-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPerformances.length > 0 ? (
                  paginatedPerformances.map((perf) => (
                    <tr
                      key={perf.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 font-medium dark:text-white">
                        {perf.user?.name}
                      </td>
                      <td className="p-3 dark:text-gray-300">{perf.period}</td>
                      <td className="p-3 dark:text-gray-300">
                        <StarRating rating={perf.productivity} />
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        <StarRating rating={perf.quality} />
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        <StarRating rating={perf.teamwork} />
                      </td>
                      <td className="p-3 dark:text-gray-300">
                        <StarRating rating={perf.discipline} />
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {perf.totalScore}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(perf)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Popover
                              open={openPopoverId === perf.id}
                              onOpenChange={(isOpen) =>
                                setOpenPopoverId(isOpen ? perf.id! : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent className="w-56 space-y-3">
                                <p className="text-sm">
                                  Yakin ingin menghapus penilaian ini?
                                </p>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenPopoverId(null)}
                                  >
                                    Batal
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(perf.id!)}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Tidak ada data penilaian yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan{" "}
              {Math.min(startIndex + itemsPerPage, filteredPerformances.length)}{" "}
              dari {filteredPerformances.length} data
            </p>
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <FormData
          initialData={formData}
          onClose={handleCloseModal}
          onSuccess={fetchPerformances}
        />
      )}
    </>
  );
}
