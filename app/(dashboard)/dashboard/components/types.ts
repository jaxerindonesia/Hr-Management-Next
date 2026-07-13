export interface DashboardStats {
  totalKaryawan: number;
  karyawanAktif: number;
  pendingSubmissions: number;
  totalGajiBulanIni: number;
}

export interface AttendancePoint {
  date: string;
  hadir: number;
  absen: number;
}

export interface DeptDist {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface RecentSubmission {
  id: string;
  status: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  reason: string;
  user: { name: string };
  submissionType: { name: string };
}

export interface NewEmployee {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  joinDate: string | null;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  attendanceChart: AttendancePoint[];
  departmentDist: DeptDist[];
  recentSubmissions: RecentSubmission[];
  newEmployees: NewEmployee[];
}

export interface TenantConfig {
  companyName?: string | null;
}

export interface HolidayItem {
  date: string;
  name: string;
  daysLeft: number;
}
