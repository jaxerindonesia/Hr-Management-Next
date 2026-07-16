"use client";

import { ExternalLink, Receipt, Wallet, CheckCircle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/helper/format-currency";
import { PettyCashDto } from "@/lib/dto/petty-cash";
import { STATUS_COLOR, STATUS_LABEL } from "../page.config";

type PettyCashDetailModalProps = {
  open: boolean;
  onClose: () => void;
  detailItem?: PettyCashDto;
  loading?: boolean;
};

export default function PettyCashDetailModal({
  open,
  onClose,
  detailItem,
  loading = false,
}: PettyCashDetailModalProps) {
  const totalUsed = detailItem?.usages?.reduce((sum, usage) => sum + usage.amount, 0) || 0;
  const remainingBalance = (detailItem?.amount || 0) - totalUsed;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[94vh] w-[50vw] overflow-y-auto p-4 md:p-6 sm:!max-w-[100rem]">
        <DialogHeader>
          <DialogTitle>Detail Petty Cash</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat detail petty cash...
          </div>
        ) : !detailItem ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Data petty cash tidak ditemukan.
          </div>
        ) : (
          <div className="space-y-6 pt-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Pemberian Dana</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(detailItem.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <Receipt className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Total Digunakan</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(totalUsed)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Sisa Saldo</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(remainingBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b pb-4 md:grid-cols-2">
              <MetaItem label="Karyawan Penerima" value={detailItem.user?.name ?? "-"} />
              <MetaItem label="Tujuan" value={detailItem.purpose || "-"} />
              <MetaItem label="Kategori" value={detailItem.category || "-"} />
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[detailItem.status] ?? ""}`}
                >
                  {STATUS_LABEL[detailItem.status] ?? detailItem.status}
                </span>
              </div>
              <MetaItem
                label="Bank Tujuan"
                value={`${detailItem.bankName || "-"} - ${detailItem.accountNumber || "-"}`}
              />
              <MetaItem
                label="Tanggal Ditransfer"
                value={
                  detailItem.transferDate
                    ? new Date(detailItem.transferDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Belum ditransfer"
                }
              />
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Receipt className="h-5 w-5 text-gray-500" />
                Rincian Penggunaan Dana
              </h4>

              {detailItem.usages && detailItem.usages.length > 0 ? (
                <div className="space-y-3">
                  {detailItem.usages.map((usage) => (
                    <div
                      key={usage.id}
                      className="flex items-start justify-between rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {usage.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(usage.usageDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(usage.amount)}
                        </p>
                        {usage.receiptUrl ? (
                          <a
                            href={usage.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Bukti Struk
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Belum ada penggunaan dana yang dilaporkan.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
