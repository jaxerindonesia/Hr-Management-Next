export type JournalDetailDto = {
  id?: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  relationType?: "none" | "customer" | "vendor";
  customerId?: string;
  vendorId?: string;
};

export type JournalDto = {
  id: string;
  journalNo: string;
  date: string;
  referenceNo?: string;
  description?: string;
  status: string;
  details: JournalDetailDto[];
};

export type JournalFormDto = {
  id: string;
  journalNo: string;
  date: string;
  referenceNo: string;
  description: string;
  status: string;
  details: JournalDetailDto[];
};
