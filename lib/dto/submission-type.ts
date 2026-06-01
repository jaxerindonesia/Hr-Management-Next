export interface SubmissionTypeDto {
    id: string;
    name: string;
    approverConfigs?: {
        approverUserId: string;
        approverUser: {
            id: string;
            name: string;
            email?: string;
        };
    }[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
