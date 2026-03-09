export interface UserDto {
  id?: string | null;
  roleId: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  email: string;
  name: string;
  nik?: string | null;
  phone?: string | null;
  position?: string | null;
  joinDate?: string | null;
  salary?: number | null;
  avatarUrl?: string | null;
  password: string;
  currentToken?: string | null;
  salt?: string | null;
  status: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}
