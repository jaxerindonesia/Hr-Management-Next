export interface AttendanceDto {
    id: string;
    userId: string;
    date: Date;
    checkIn?: Date | null;
    checkOut?: Date | null;
    status: string;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
