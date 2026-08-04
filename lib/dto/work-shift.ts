export interface WorkShiftDto {
  id?: string;
  tenantId?: string;
  branchId: string;
  name: string;
  code?: string | null;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
  lateToleranceMinutes: number | null;
  isActive: boolean;
  branch?: { id: string; name: string };
}

export interface EmployeeShiftScheduleDto {
  id?: string;
  branchId: string;
  userId: string;
  shiftId: string | null;
  isDayOff: boolean;
  workDate: string;
  user?: { id: string; name: string; nik?: string | null; position?: string | null };
  shift?: WorkShiftDto;
  branch?: { id: string; name: string };
}
