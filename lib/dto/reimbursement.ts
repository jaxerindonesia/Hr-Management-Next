export interface ReimbursementDto {
    id?: string | null;
    userId: string;
    title: string;
    category: string;
    amount: number;
    date: string;
    description?: string | null;
    receiptUrl?: string | null;
    status: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    user?: {
        id: string;
        name: string;
        position?: string | null;
        department?: string | null;
    } | null;
}
