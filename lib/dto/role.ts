export interface RoleDto {
    id: string;
    name: string;
    permission: any;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}