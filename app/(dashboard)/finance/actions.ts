import type { FinanceLedgerRowDto, PaginatedDto } from "@/lib/dto/finance";

export async function fetchFinanceLedger(params: URLSearchParams) {
  const res = await fetch(`/api/finance/ledgers?${params.toString()}`, { cache: "no-store" });
  const json: PaginatedDto<FinanceLedgerRowDto> = await res.json();
  return json;
}
