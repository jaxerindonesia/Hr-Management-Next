export interface DashboardStats {
  totalKaryawan: number;
  karyawanAktif: number;
  pendingSubmissions: number;
  totalGajiBulanIni: number;
}

export interface DashboardSummaryCard {
  title: string;
  value: string | number;
  sub?: string;
  tone: "blue" | "emerald" | "orange" | "violet" | "teal";
  icon: "users" | "check" | "money" | "clipboard" | "building" | "briefcase" | "receipt" | "clock";
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

export interface TopTenantItem {
  id: string;
  companyName: string;
  employeeCount: number;
  activeEmployeeCount: number;
  departmentCount: number;
  activeEmployeeRate: number;
}

export interface ActiveTenantItem {
  id: string;
  companyName: string;
  activityCount: number;
  attendanceCount: number;
  submissionCount: number;
  overtimeCount: number;
  reimbursementCount: number;
  performanceCount: number;
  taskCount: number;
}

export interface ExpiringTenantItem {
  id: string;
  companyName: string;
  subscriptionEnd: string | null;
  daysRemaining: number | null;
  employeeCount: number;
  isActive: boolean;
}

export interface TenantGrowthPoint {
  label: string;
  tenants: number;
  employees: number;
}

export interface RecentAttendanceItem {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string | null;
}

export interface RecentJournalItem {
  id: string;
  journalNo: string;
  date: string;
  status: string;
  description: string | null;
  totalLines: number;
}

export interface DashboardData {
  roleName: string;
  roleKey: "super_admin" | "admin" | "employee" | "finance";
  subtitle: string;
  summaryCards: DashboardSummaryCard[];
  stats: DashboardStats;
  attendanceChart: AttendancePoint[];
  departmentDist: DeptDist[];
  recentSubmissions: RecentSubmission[];
  newEmployees: NewEmployee[];
  topTenants: TopTenantItem[];
  activeTenants: ActiveTenantItem[];
  expiringTenants: ExpiringTenantItem[];
  tenantGrowthMonthly: TenantGrowthPoint[];
  tenantGrowthYearly: TenantGrowthPoint[];
  recentAttendances: RecentAttendanceItem[];
  recentJournals: RecentJournalItem[];
}

export interface TenantConfig {
  companyName?: string | null;
}

export interface HolidayItem {
  date: string;
  name: string;
  daysLeft: number;
}
