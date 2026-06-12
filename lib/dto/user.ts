export interface UserDto {
  id?: string | null;
  tenantId?: string | null;
  roleId: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  role?: { id: string; name: string } | null;
  tenant?: { id: string; companyName: string } | null;
  email: string;
  name: string;
  nik?: string | null;
  phone?: string | null;
  position?: string | null;
  joinDate?: string | null;
  salary?: number | null;
  gender?: string | null;
  address?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  avatarUrl?: string | null;
  password?: string;
  currentToken?: string | null;
  salt?: string | null;
  status: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}
