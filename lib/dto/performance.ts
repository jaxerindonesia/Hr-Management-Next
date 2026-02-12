export interface PerformanceDto {
    id?: string | null;
    userId: string;
    period: string;
    productivity: number;
    quality: number;
    teamwork: number;
    discipline: number;
    totalScore: number;
    notes?: string | null;
    evaluatedBy: string;
    evaluatedAt?: Date | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
    user?: {
        id: string;
        name: string;
    } | null;
}
