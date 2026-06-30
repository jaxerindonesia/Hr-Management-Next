export type AccountCategory = { id: string; code: string; name: string };

export type Account = {
  id: string;
  code: string;
  name: string;
  normalBalance: string;
  isActive: boolean;
  accountCategory: AccountCategory;
};

export type JournalDetail = {
  id?: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  relationType?: "none" | "customer" | "vendor";
  customerId?: string;
  vendorId?: string;
};

export type Journal = {
  id: string;
  journalNo: string;
  date: string;
  referenceNo?: string;
  description?: string;
  status: string;
  details: JournalDetail[];
};

export type CategoryFormState = {
  id: string;
  code: string;
  name: string;
};

export type AccountFormState = {
  id: string;
  code: string;
  name: string;
  normalBalance: string;
  accountCategoryId: string;
  isActive: boolean;
};

export type JournalFormState = {
  id: string;
  journalNo: string;
  date: string;
  referenceNo: string;
  description: string;
  status: string;
  details: JournalDetail[];
};

export type Partner = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type PartnerFormState = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};
