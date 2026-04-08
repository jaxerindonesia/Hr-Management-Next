export interface DepartmentDto {
  id: string;
  name: string;
  tenantId?: string | null;
  tenant?: { id: string; companyName: string } | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
