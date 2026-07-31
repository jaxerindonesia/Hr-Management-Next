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
  officeStartTime: string;
  officeEndTime: string;
  isActive: boolean;
  tenant?: { id: string; companyName: string } | null;
}
