export interface UserDto {
    id?: string | null;
    roleId: string;
    email: string;
    name: string;
    nik?: string | null;
    phone?: string | null;
    position?: string | null;
    department?: string | null;
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