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
        position?: string | null;
        department?: { id: string; name: string } | null;
    } | null;
    kpiBreakdown?: {
        hasSufficientData?: boolean;
        attendanceCount: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        autoCheckoutCount: number;
        approvedSubmissionCount: number;
        assignedTaskCount: number;
        completedTaskCount: number;
        overdueTaskCount: number;
        collaborativeTaskCount: number;
        approvedOvertimeCount: number;
        approvedOvertimeMinutes: number;
        approvedOvertimeAmount: number;
        productivityScore: number;
        qualityScore: number;
        teamworkScore: number;
        disciplineScore: number;
    } | null;
}
