export const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `Rp ${formatted}`;
};

export function formatAmount(value: number) {
    return `Rp ${new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)}`;
}
