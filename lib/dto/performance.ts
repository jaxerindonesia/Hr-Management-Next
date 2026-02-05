export interface PerformanceDto {
    id: string;
    userId: string;
    period: string;
    productivity: number;
    quality: number;
    teamwork: number;
    discipline: number;
    totalScore: number;
    notes?: string | null;
    evaluatedBy: string;
    evaluatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
