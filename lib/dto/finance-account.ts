import type { AccountCategoryDto } from "@/lib/dto/finance-account-category";

export type AccountDto = {
  id: string;
  code: string;
  name: string;
  normalBalance: string;
  isActive: boolean;
  accountCategory: AccountCategoryDto;
  parent?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export type AccountFormDto = {
  id: string;
  code: string;
  name: string;
  normalBalance: string;
  accountCategoryId: string;
  parentId: string;
  isActive: boolean;
};
