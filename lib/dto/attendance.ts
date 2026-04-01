export interface AttendanceDto {
  id: string;
  userId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status:
    | "On Time"
    | "Late"
    | "Present"
    | "Half Day"
    | "Late - Present"
    | "Late - Half Day"
    | "Absent";
  workHours: string;
  notes?: string | null;
  checkInLocation?: LocationData;
  checkOutLocation?: LocationData;
  checkInFaceImage?: string | null;
  checkOutFaceImage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user?: {
    id: string;
    name: string;
  } | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}
