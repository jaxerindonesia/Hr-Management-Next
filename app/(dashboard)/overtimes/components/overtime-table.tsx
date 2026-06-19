"use client";

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OvertimeDto } from "@/lib/dto/overtime";
import { formatCurrency } from "@/lib/helper/format-currency";

type ApproverColumn = { id: string; name: string };

type OvertimeTableProps = {
  items: OvertimeDto[];
  total: number;
  currentPage: number;
  totalPages: number;
  userId: string;
  isAdmin: boolean;
  approverColumns: ApproverColumn[];
  openPopoverId: string | null;
  onOpenEdit: (item: OvertimeDto) => void;
  onApproveClick: (item: OvertimeDto) => void;
  onOpenReject: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleDeletePopover: (id: string | null) => void;
  onPageChange: (page: number) => void;
  getApproverDecision: (item: OvertimeDto) => { status: string } | undefined;
  statusLabel: Record<string, string>;
  statusColor: Record<string, string>;
};

function getPages(currentPage: number, totalPages: number) {
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
  return pages;
}

export function OvertimeTable({
  items,
  total,
  totalPages,
  currentPage,
  userId,
  isAdmin,
  approverColumns,
  openPopoverId,
  onOpenEdit,
  onApproveClick,
  onOpenReject,
  onDelete,
  onToggleDeletePopover,
  onPageChange,
  getApproverDecision,
  statusLabel,
  statusColor,
}: OvertimeTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left p-3 font-semibold dark:text-gray-300">Karyawan</th>
              <th className="text-left p-3 font-semibold dark:text-gray-300">Tanggal</th>
              <th className="text-left p-3 font-semibold dark:text-gray-300">Durasi</th>
              <th className="text-left p-3 font-semibold dark:text-gray-300">Nominal</th>
              <th className="text-left p-3 font-semibold dark:text-gray-300">Status</th>
              <th className="text-left p-3 font-semibold dark:text-gray-300">Keterangan</th>
              {approverColumns.length > 0 ? (
                approverColumns.map((approver) => (
                  <th key={approver.id} className="text-left p-3 font-semibold dark:text-gray-300">
                    Approval {approver.name}
                  </th>
                ))
              ) : (
                <th className="text-left p-3 font-semibold dark:text-gray-300">Approval</th>
              )}
              <th className="text-right p-3 font-semibold dark:text-gray-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 font-medium dark:text-white">{item.user?.name || "-"}</td>
                  <td className="p-3 dark:text-gray-300">{new Date(item.overtimeDate).toLocaleDateString("id-ID")}</td>
                  <td className="p-3 dark:text-gray-300">{Math.floor(item.overtimeMinutes / 60)} jam</td>
                  <td className="p-3 dark:text-gray-300">{formatCurrency(item.payoutAmount || 0)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor[item.status] || "bg-slate-100 text-slate-700"}`}>
                      {statusLabel[item.status] || item.status}
                    </span>
                  </td>
                  <td className="p-3 dark:text-gray-300 max-w-[280px] truncate">{item.description || "-"}</td>
                  {approverColumns.length > 0 ? (
                    approverColumns.map((approver) => {
                      const decision = (item.approvalDecisions || []).find(
                        (itemDecision) => itemDecision.approverUserId === approver.id,
                      );
                      const text = decision
                        ? `${statusLabel[decision.status] || decision.status}${decision.status === "REJECTED" && decision.reason ? `: ${decision.reason}` : ""}`
                        : "-";
                      return (
                        <td key={`${item.id}-${approver.id}`} className="p-3 text-sm dark:text-gray-300">
                          {text}
                        </td>
                      );
                    })
                  ) : (
                    <td className="p-3 text-sm text-gray-400">Belum ada approver</td>
                  )}
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === "PENDING" && item.userId === userId && (
                        <button onClick={() => onOpenEdit(item)} title="Edit Keterangan" className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {item.status === "PENDING" && getApproverDecision(item)?.status === "PENDING" && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => onApproveClick(item)}>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => onOpenReject(item.id || "")}>
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {isAdmin && (
                        <Popover
                          open={openPopoverId === item.id}
                          onOpenChange={(isOpen) => onToggleDeletePopover(isOpen ? item.id || null : null)}
                        >
                          <PopoverTrigger asChild>
                            <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 space-y-3">
                            <p className="text-sm">Yakin ingin menghapus overtime ini?</p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => onToggleDeletePopover(null)}>
                                Batal
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => onDelete(item.id || "")}>
                                Hapus
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7 + Math.max(1, approverColumns.length)} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Belum ada data lembur
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 dark:border-gray-700 gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{items.length}</span> dari{" "}
          <span className="font-semibold text-gray-900 dark:text-white">{total}</span> overtime
          {totalPages > 0 && <span> — Halaman {currentPage} dari {totalPages}</span>}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {getPages(currentPage, totalPages).map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm select-none">...</span>
                ) : (
                  <button key={page} onClick={() => onPageChange(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                    {page}
                  </button>
                ),
              )}
            </div>
            <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
