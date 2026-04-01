import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Kehadiran</DialogTitle>
        </DialogHeader>

        <div className="border-t pt-4 space-y-3 text-sm">
          <div>
            <span className="font-medium">Tanggal:</span>{" "}
            {new Date(initialData.date).toLocaleDateString()}
          </div>

          <div>
            <span className="font-medium">Check In:</span>{" "}
            {initialData.checkIn
              ? new Date(initialData.checkIn).toLocaleTimeString()
              : "-"}
          </div>

          <div>
            <span className="font-medium">Check Out:</span>{" "}
            {initialData.checkOut
              ? new Date(initialData.checkOut).toLocaleTimeString()
              : "-"}
          </div>

          <div>
            <span className="font-medium">Status:</span>{" "}
            {statusLabel[initialData.status] || initialData.status}
          </div>

          {/* <div>
            <span className="font-medium">Notes:</span>{" "}
            {initialData.notes || "-"}
          </div> */}

          {/* CHECK IN LOCATION */}
          {initialData.checkInLocation && (
            <div className="space-y-1">
              <span className="font-medium">Lokasi Check In:</span>
              <div>Lat: {initialData.checkInLocation.latitude}</div>
              <div>Lng: {initialData.checkInLocation.longitude}</div>

              <a
                href={`https://www.google.com/maps?q=${initialData.checkInLocation.latitude},${initialData.checkInLocation.longitude}`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Lihat di Google Maps
              </a>
            </div>
          )}

          {/* CHECK OUT LOCATION */}
          {initialData.checkOutLocation && (
            <div className="space-y-1 pt-3 border-t">
              <span className="font-medium">Lokasi Check Out:</span>

              <div>Lat: {initialData.checkOutLocation.latitude}</div>

              <div>Lng: {initialData.checkOutLocation.longitude}</div>

              <a
                href={`https://www.google.com/maps?q=${initialData.checkOutLocation.latitude},${initialData.checkOutLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Lihat di Google Maps
              </a>
            </div>
          )}

          {(initialData.checkInFaceImage || initialData.checkOutFaceImage) && (
            <div className="space-y-2 pt-3 border-t">
              <span className="font-medium">Bukti Wajah:</span>
              <div className="flex gap-3">
                {initialData.checkInFaceImage && (
                  <a
                    href={initialData.checkInFaceImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={initialData.checkInFaceImage}
                      alt="Bukti check in"
                      className="w-24 h-24 rounded-md object-cover border"
                    />
                    <div className="text-xs text-center mt-1">Check In</div>
                  </a>
                )}
                {initialData.checkOutFaceImage && (
                  <a
                    href={initialData.checkOutFaceImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={initialData.checkOutFaceImage}
                      alt="Bukti check out"
                      className="w-24 h-24 rounded-md object-cover border"
                    />
                    <div className="text-xs text-center mt-1">Check Out</div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
