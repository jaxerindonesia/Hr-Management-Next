import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Timer, Clock3, BadgeCheck, Image as ImageIcon, Calendar } from "lucide-react";
import { AttendanceDto } from "@/lib/dto/attendance";

export default function DetailData({
  initialData,
  onClose,
}: {
  initialData: AttendanceDto;
  onClose: () => void;
}) {
  const statusLabel: Record<string, string> = {
    "On Time": "Tepat Waktu",
    Present: "Hadir",
    Late: "Terlambat",
    "Late - Present": "Telat - Hadir",
    "Late - Half Day": "Telat - Setengah Hari",
    Absent: "Tidak Hadir",
    "Half Day": "Setengah Hari",
  };

  const cardDetail = (
    title: string,
    duration: string,
    context: string,
    checkIn: string | null,
    checkOut: string | null,
    checkInFaceImage: string | null,
    checkOutFaceImage: string | null,
    checkInLocation: { latitude: number; longitude: number } | null,
    checkOutLocation: { latitude: number; longitude: number } | null
  ) => {
    return (
      <div className="mt-5 rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Timer className="h-4 w-4 text-amber-600" />
          {title}
        </div>
        <div className="mt-3 space-y-3">

          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">
                Durasi {title}: {duration || "-"}
              </span>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {context} In
                </div>
                <div className="my-1 font-semibold text-slate-900">
                  {checkIn
                    ? new Date(checkIn).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "-"}
                </div>
                {checkInFaceImage && (
                  <a
                    href={checkInFaceImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <img
                      src={checkInFaceImage}
                      alt="Bukti check in"
                      className="h-28 w-28 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-[1.02]"
                    />
                  </a>
                )}
                {checkInLocation && (
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      Lokasi
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${checkInLocation.latitude},${checkInLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      Lihat di Google Maps
                    </a>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {context} Out
                </div>
                <div className="my-1 font-semibold text-slate-900">
                  {checkOut
                    ? new Date(checkOut).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "-"}
                </div>
                {checkOutFaceImage && (
                  <a
                    href={checkOutFaceImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <img
                      src={checkOutFaceImage}
                      alt="Bukti check out"
                      className="h-28 w-28 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-[1.02]"
                    />
                  </a>
                )}
                {checkOutLocation && (
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      Lokasi
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${checkOutLocation.latitude},${checkOutLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      Lihat di Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-0">
        <div className="center flex items-center justify-between pt-4 px-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Detail Kehadiran
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Calendar className="h-4 w-4" />
                Tanggal
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {new Date(initialData.date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <BadgeCheck className="h-4 w-4" />
                Status
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {statusLabel[initialData.status] || initialData.status}
              </div>
            </div>
          </div>

          {cardDetail(
            "Riwayat Kehadiran",
            initialData.workHours === "0" ? "-" : initialData.workHours,
            "Check",
            initialData.checkIn || null,
            initialData.checkOut || null,
            initialData.checkInFaceImage || null,
            initialData.checkOutFaceImage || null,
            initialData.checkInLocation || null,
            initialData.checkOutLocation || null
          )}

          {initialData.breakSessions?.length ? (
            <>
              {initialData.breakSessions.map((session, index) => (
                <div key={index}>
                  {cardDetail(
                    "Riwayat Istirahat/Break",
                    session.duration || "-",
                    "Istirahat/Break",
                    session.breakIn || null,
                    session.breakOut || null,
                    session.breakInFaceImage || null,
                    session.breakOutFaceImage || null,
                    session.breakInLocation || null,
                    session.breakOutLocation || null
                  )}
                </div>
              ))}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
