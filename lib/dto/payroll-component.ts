export interface PayrollComponentConfigDto {
  id?: string | null;
  tenantId?: string | null;
  name: string;
  type: "EARNING" | "DEDUCTION";
  inputType: "FIXED" | "PERCENTAGE" | "MANUAL";
  defaultValue: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface PayrollComponentValueDto {
  id?: string | null;
  payrollId?: string | null;
  componentConfigId?: string | null;
  nameSnapshot: string;
  typeSnapshot: "EARNING" | "DEDUCTION";
  inputTypeSnapshot: "FIXED" | "PERCENTAGE" | "MANUAL";
  amount: number;
  baseValue?: number | null;
}
