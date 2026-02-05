export interface SubmissionDto {
    id: string;
    userId: string;
    submissionTypeId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: string;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
