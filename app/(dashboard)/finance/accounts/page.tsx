import FinanceListPage from "../components/finance-list-page";

export default function FinanceAccountsPage() {
  return (
    <FinanceListPage
      mode="accounts"
      title="Akun"
      description="Kelola daftar akun finance beserta kategori dan saldo normalnya."
    />
  );
}
