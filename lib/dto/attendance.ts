export interface AttendanceDto {
  id: string;
  userId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: "Present" | "Late" | "Absent" | "Half Day";
  workHours: string;
  notes?: string | null;
  checkInLocation?: LocationData;
  checkOutLocation?: LocationData;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}
