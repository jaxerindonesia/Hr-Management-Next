export type FinanceSummaryDto = {
  accountCount: number;
  journalCount: number;
  postedJournalCount: number;
  draftJournalCount: number;
  totalDebit: number;
  totalCredit: number;
  revenueBalance: number;
  cashBankBalance: number;
  receivableBalance: number;
  payableBalance: number;
  profitLossBalance: number;
  topRevenueAccounts: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
  }>;
  topReceivableAccounts: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
  }>;
  topPayableAccounts: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
  }>;
  topExpenseAccounts: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    debit: number;
    credit: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    total: number;
  }>;
};

export type FinanceLedgerRowDto = {
  accountId: string;
  accountCode: string;
  accountName: string;
  normalBalance: "DEBIT" | "CREDIT";
  journalNo: string;
  journalDate: string;
  referenceNo: string | null;
  description: string | null;
  detailDescription: string | null;
  debit: number;
  credit: number;
  balance: number;
};

export type PaginatedDto<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
