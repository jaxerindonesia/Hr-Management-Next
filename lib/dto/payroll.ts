export interface PayrollDto {
    id?: string | null;
    userId: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    totalSalary: number;
    status: string;
    paidAt?: Date | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
    user?: {
        id: string;
        name: string;
    } | null;
}
