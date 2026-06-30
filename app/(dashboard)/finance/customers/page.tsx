import FinanceListPage from "../components/finance-list-page";

export default function FinanceCustomersPage() {
  return (
    <FinanceListPage
      mode="customers"
      title="Customer"
      description="Kelola data customer yang dipakai di jurnal dan transaksi finance."
    />
  );
}
