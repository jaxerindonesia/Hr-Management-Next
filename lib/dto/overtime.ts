export interface OvertimeDto {
  id?: string | null;
  tenantId?: string | null;
  userId: string;
  attendanceId?: string | null;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  overtimeMinutes: number;
  requestedMinutes: number;
  description?: string | null;
  rejectReason?: string | null;
  payMethod: "PER_HOUR" | "PER_DAY";
  hourlyRate: number;
  dailyRate: number;
  payoutAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user?: {
    id: string;
    name: string;
  } | null;
  attendance?: {
    id: string;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
  } | null;
  approvalDecisions?: {
    approverUserId: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason?: string | null;
    decidedAt?: string | null;
    approverUser?: {
      id: string;
      name: string;
    } | null;
  }[];
}

export interface OvertimeConfigDto {
  id?: string | null;
  tenantId?: string | null;
  payMethod: "PER_HOUR" | "PER_DAY";
  hourlyRate: number;
  dailyRate: number;
  approverConfigs?: {
    approverUserId: string;
    approverUser: {
      id: string;
      name: string;
      email?: string | null;
    };
  }[];
  createdAt?: string | null;
  updatedAt?: string | null;
}
