export interface SubmissionDto {
    id?: string | null;
    userId: string;
    submissionTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
    user?: {
        id: string;
        name: string;
    } | null;
    submissionType?: {
        id: string;
        name: string;
        approverConfigs?: {
            approverUserId: string;
            approverUser: { id: string; name: string };
        }[];
    } | null;
    approvalDecisions?: {
        approverUserId: string;
        status: string;
        reason?: string | null;
        decidedAt?: string | Date | null;
    }[];
}
