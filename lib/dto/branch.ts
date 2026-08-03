export interface BranchDto {
  id?: string | null;
  tenantId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  attendanceRadiusMeters: number;
  locationLockEnabled: boolean;
  customWorkingHoursEnabled: boolean;
  scheduleType: "REGULAR" | "SHIFT";
  officeStartTime: string;
  officeEndTime: string;
  workingSchedules: BranchWorkingScheduleDto[];
  isActive: boolean;
  tenant?: { id: string; companyName: string } | null;
}

export interface BranchWorkingScheduleDto {
  id?: string;
  dayOfWeek: string;
  isWorkDay: boolean;
  startTime: string | null;
  endTime: string | null;
}
