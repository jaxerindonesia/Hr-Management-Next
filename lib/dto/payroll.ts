import type { PayrollComponentValueDto } from "@/lib/dto/payroll-component";

export interface PayrollDto {
    id?: string | null;
    userId: string;
    referenceNumber?: string | null;
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
    componentValues?: PayrollComponentValueDto[];
    user?: {
        id: string;
        name: string;
    } | null;
}
