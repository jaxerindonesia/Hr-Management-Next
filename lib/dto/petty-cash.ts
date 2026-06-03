export interface PettyCashDto {
  id?: string | null;
  userId: string;
  purpose: string;
  category: string;
  amount: number;
  transferDate?: string | null;
  bankName: string;
  accountNumber: string;
  status: string;
  createdBy?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  user?: {
    id: string;
    name: string;
    position?: string | null;
    department?:
      | string
      | {
          id?: string;
          name?: string | null;
        }
      | null;
  } | null;
  usages?: PettyCashUsageDto[];
}

export interface PettyCashUsageDto {
  id?: string | null;
  pettyCashId: string;
  description: string;
  amount: number;
  usageDate: string;
  receiptUrl?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}
