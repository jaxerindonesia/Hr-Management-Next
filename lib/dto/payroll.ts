export interface PayrollDto {
    id: string;
    userId: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    totalSalary: number;
    status: string;
    paidAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
