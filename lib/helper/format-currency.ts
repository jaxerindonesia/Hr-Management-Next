export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    currencyDisplay: "code",
  })
    .format(amount)
    .replace("IDR", "Rp");
};