import LedgerPage from "../components/ledger-page";
import prisma from "@/lib/prisma";

type LedgerAccount = {
  id: string;
  code: string;
  name: string;
  normalBalance: "DEBIT" | "CREDIT";
  isActive: boolean;
};

export default async function FinanceLedgerRoute() {
  const accounts: LedgerAccount[] = await prisma.account.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      normalBalance: true,
      isActive: true,
      accountCategory: true,
    },
  });

  return <LedgerPage accounts={accounts} />;
}
